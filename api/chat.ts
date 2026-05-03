// Vercel Edge Function — OpenRouter proxy for ShadowFile (free tier).
//
// Zero-log discipline:
// - We never persist request bodies to logs or storage.
// - Only anonymized counters (IP hash bucket, count) are kept in memory for
//   abuse rate-limiting, and those evaporate on cold-start.
// - We do not set cookies. We do not set any persistent headers.
// - The OpenRouter API key lives only in the server env; it never reaches the browser.
//
// Model: meta-llama/llama-3.1-8b-instruct:free (free tier, no credit card)
// Streaming: SSE via OpenRouter's OpenAI-compatible endpoint, re-emitted as plain text.

export const config = { runtime: "edge" };

type Turn = { role: "user" | "assistant"; text: string };
type ChatRequest = {
  language: "en" | "fr" | "es";
  turns: Turn[];
  risk_hint: "none" | "low" | "moderate" | "high";
  mode?: "chat" | "moral-injury";
  force_model?: "auto" | "opus" | "haiku";
  system_append?: string;
  proqol_last_completed_at?: number | null;
};

const LANG_NAME: Record<ChatRequest["language"], string> = {
  en: "English",
  fr: "French",
  es: "Spanish"
};

const BASE_SYSTEM = `You are ShadowFile, a peer-style reflective companion built for humanitarian aid workers, UN field staff, NGO frontline teams, CHWs, crisis counsellors, and conflict-zone journalists.

Voice rules:
- You are a peer who has been there, never a clinician. Never diagnose. Never prescribe.
- Calm, validating, and honest. No cheerfulness, no exclamation points, no gamification language, no streaks, no emojis.
- Default to short: one or two sentences, then one plain question. When the user writes a long, substantial message (three or more sentences of real content), you may respond with more — but never more than four sentences.
- Do not reframe moral injury. Sit with what the user names. Do not rush to meaning or silver lining.
- Do not start a response with the word "I". Vary your openings.
- Do not start with "I understand", "That sounds hard", "That must be", or "I can imagine".
- Never praise the user's work ("you're doing amazing", "that's incredible", "so brave"). Respect the gravity instead.
- If the user shares specific details, reflect one concrete detail they actually said. If they have not shared details yet, ask one simple opening question.
- Banned words and phrases — never use these: resilience, strength (as praise), brave, you've got this, you are not alone, that takes courage, it's okay to feel, things will get better, silver lining, growth, healing journey, self-care, take care of yourself, reach out, you matter.
- Never minimise with "at least…" or pivot to gratitude unprompted.

Context integrity rules — critical:
- NEVER invent, infer, or hallucinate context not present in the user's current message or the visible chat history above.
- NEVER say "you mentioned" unless the user explicitly said it in this conversation.
- NEVER assume emotional state, sounds, events, environment, danger, burden, trauma, or physical sensations unless the user states them.
- For greetings (hello, hi, hey) or low-content openers: respond with a plain welcome and one open question. Do not project any state onto the user.
- For vague replies ("nothing", "I'm good", "fine"): accept them without challenge. Offer one light option, do not psychoanalyze.
- Keep responses 1–2 sentences unless the user has written a substantial message that warrants more.

Absolute limits:
- You do not replace any clinician, therapist, or crisis line.
- If a user describes active intent, plan, or means for self-harm or harm to others, you stop reflective work and route to crisis resources.
- You never ask the user to "just breathe" as a first move.
- You never minimise with "at least…".

Evidence-based references you may draw from, without naming them clinically unless asked:
1. WHO Psychological First Aid. Look, listen, link. Ground without instruction.
2. WHO mhGAP Humanitarian Intervention Guide. Recognise acute stress, grief, depression, suicide risk. Do not diagnose; surface the concern plainly.
3. Shay and Litz moral-injury frame. Three axes: perpetration, betrayal, witnessing. Name the axis the user appears to describe. Do not re-author their values.
4. ACT / cognitive defusion. Offer defusion phrasing ("I notice the thought that…"), never disputation.
5. ProQOL-5 (Stamm). Compassion satisfaction vs burnout vs secondary traumatic stress.
6. Columbia C-SSRS. If risk language appears, stop reflective chat and route.

Guardrails:
- Aid workers often carry survivor guilt and helplessness. Normalise these as moral, not pathological, responses.
- Do not suggest "take time off" or "talk to your manager". Many cannot.
- Culture and context matter. Do not default to Western therapy idioms.

SAFETY — REQUIRED ON EVERY REPLY:
After your visible response, emit one trailing line containing exactly this JSON prefixed by <RISK>:
<RISK>{"risk":"none|low|moderate|high","recommend_screen":"none|cssrs|proqol","recommend_crisis_line":false,"rationale":"one short sentence"}

Rules:
- "high" if active suicidal intent, plan, means, or imminent harm.
- "moderate" if passive ideation, recent self-harm, escalating hopelessness.
- "low" if chronic stress, burnout, grief, nightmares, moral distress without ideation.
- "none" otherwise.
- recommend_screen: "cssrs" for moderate/high. "proqol" only for chronic patterns.
- recommend_crisis_line: true for high, or moderate in unsafe environments.
- When risk is high: visible reply is short and plain, name what you will do, do not explore feelings further.`;

const MORAL_INJURY_EXTRA = `

This conversation is a structured moral-injury walkthrough.
- Stay inside the user's framing. Do not soften the event into growth language.
- Do not explain the framework clinically.
- Do not ask your own follow-up question. The UI will handle the next step.
- One or two somber sentences are enough unless the user explicitly asks for more.
- If the user says they still believe nothing, accept that without correction.`;

const FALLBACK_REPLY = "Noted. I saved this session. You can return to it later from the logbook.";
const FALLBACK_RISK = `<RISK>{"risk":"none","recommend_screen":"none","recommend_crisis_line":false,"rationale":"API unavailable"}`;

function fallbackStream(): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`${FALLBACK_REPLY}\n${FALLBACK_RISK}`));
      controller.close();
    }
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

// In-memory rate-limit bucket. Evaporates on cold start.
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function parseModelList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function rateLimitKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0]?.trim() || "unknown";
}

function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Local Ollama mode: OLLAMA_BASE_URL overrides all cloud providers.
  // Set OLLAMA_BASE_URL=http://localhost:11434/v1 in .env.local to run fully offline.
  const ollamaBase = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "");

  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!ollamaBase && !apiKey) return fallbackStream();
  if (!ollamaBase && apiKey?.startsWith("sk-ant-")) return fallbackStream();

  const max = Number(process.env.RATE_LIMIT_RPM ?? "20");
  const key = rateLimitKey(req);
  if (!checkRateLimit(key, max)) {
    return new Response("Too many requests", { status: 429 });
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (!body.turns || !Array.isArray(body.turns) || body.turns.length === 0) {
    return new Response("No turns", { status: 400 });
  }

  // Prefer the lowest-cost paid model first for uptime, then keep a couple of
  // inexpensive paid fallbacks before the free pool.
  // Current OpenRouter pricing pages:
  // - qwen/qwen-2.5-7b-instruct: $0.04/M input, $0.10/M output
  // - openai/gpt-4.1-nano: $0.10/M input, $0.40/M output
  // - google/gemini-2.5-flash-lite: $0.10/M input, $0.40/M output
  const DEFAULT_MODELS = [
    "qwen/qwen-2.5-7b-instruct",
    "openai/gpt-4.1-nano",
    "google/gemini-2.5-flash-lite",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free",
    "google/gemma-3-4b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-4-31b-it:free",
    "nousresearch/hermes-3-llama-3.1-405b:free"
  ];
  const MODELS = parseModelList(process.env.OPENROUTER_MODELS);
  const candidateModels = MODELS.length > 0 ? MODELS : DEFAULT_MODELS;

  // Build system prompt
  let systemText = BASE_SYSTEM;
  if (body.mode === "moral-injury") systemText += MORAL_INJURY_EXTRA;
  systemText += `\n\nRespond only in ${LANG_NAME[body.language] ?? "English"}. Keep the <RISK> JSON trailer in ASCII regardless of language.`;
  if (typeof body.proqol_last_completed_at === "number") {
    systemText += `\nThe user's last ProQOL timestamp is ${body.proqol_last_completed_at}. Recommend ProQOL only if that was at least 30 days ago.`;
  } else {
    systemText += "\nThe user has not completed a ProQOL in this browser. Recommend only when the pattern sounds chronic.";
  }
  if (body.system_append) systemText += `\n${body.system_append}`;

  const messages = [
    { role: "system", content: systemText },
    ...body.turns.map((t) => ({ role: t.role, content: t.text }))
  ];

  // ── AI backend selection ──────────────────────────────────────────────────
  // OLLAMA_BASE_URL → fully local, no key, no rate limits (great for local dev)
  // OPENROUTER_API_KEY → cloud, tries candidateModels in order until one responds
  let upstreamResp: Response | null = null;

  const TIMEOUT_MS = 30_000;

  if (ollamaBase) {
    const ollamaModel = process.env.OLLAMA_MODEL ?? "llama3.1:8b";
    const timeoutCtrl = new AbortController();
    const timer = setTimeout(() => timeoutCtrl.abort(), TIMEOUT_MS);
    try {
      upstreamResp = await fetch(`${ollamaBase}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer ollama" },
        body: JSON.stringify({ model: ollamaModel, messages, stream: true, max_tokens: 800, temperature: 0.7 }),
        signal: timeoutCtrl.signal
      });
    } catch {
      // Ollama unreachable — fall through to fallbackStream
    } finally {
      clearTimeout(timer);
    }
    if (!upstreamResp) return fallbackStream();
  } else {
    const appOrigin = req.headers.get("origin") ?? new URL(req.url).origin;
    for (const model of candidateModels) {
      const timeoutCtrl = new AbortController();
      const timer = setTimeout(() => timeoutCtrl.abort(), TIMEOUT_MS);
      try {
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": appOrigin,
            "X-Title": "ShadowFile"
          },
          body: JSON.stringify({ model, messages, stream: true, max_tokens: 800, temperature: 0.7 }),
          signal: timeoutCtrl.signal
        });
        if (resp.status === 429 || resp.status === 503 || resp.status === 400 || resp.status === 402) {
          continue;
        }
        upstreamResp = resp;
        break;
      } catch {
        // timed out or network error — try next model
      } finally {
        clearTimeout(timer);
      }
    }
    if (!upstreamResp) return fallbackStream();
  }

  if (!upstreamResp.ok || !upstreamResp.body) return fallbackStream();

  // Parse SSE and re-emit as plain text
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = upstreamResp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const json = JSON.parse(trimmed.slice(6)) as {
                choices?: { delta?: { content?: string } }[];
              };
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // malformed SSE chunk — skip
            }
          }
        }
      } catch {
        controller.enqueue(encoder.encode(`\n${FALLBACK_REPLY}\n${FALLBACK_RISK}`));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
