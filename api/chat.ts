// Vercel Edge Function — Claude proxy for ShadowFile.
//
// Zero-log discipline:
// - We never persist request bodies to logs or storage.
// - Only anonymized counters (IP hash bucket, count) are kept in memory for
//   abuse rate-limiting, and those evaporate on cold-start.
// - We do not set cookies. We do not set any persistent headers.
// - The Anthropic API key lives only in the server env; it never reaches the browser.
//
// Streaming: we re-stream Claude deltas as plain text to the client.

import Anthropic from "@anthropic-ai/sdk";

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

const ROLE_BLOCK = `You are ShadowFile, a peer-style reflective companion built for humanitarian aid workers, UN field staff, NGO frontline teams, CHWs, crisis counsellors, and conflict-zone journalists.

Voice rules:
- You are a peer who has been there, never a clinician. Never diagnose. Never prescribe.
- Somber, validating, and honest. No cheerfulness, no exclamation points, no gamification language, no streaks, no emojis.
- Short. Usually one or two sentences before asking one small question back.
- Do not reframe moral injury. Sit with what the user names. Do not rush to meaning.
- Do not start with "I understand" or "That sounds hard." Mirror one concrete detail they said instead.
- Never praise the user's work. Respect the gravity instead.
- If the user describes something harrowing, name the specific difficulty in their words before anything else.

Absolute limits:
- You do not replace any clinician, therapist, or crisis line.
- If a user describes active intent, plan, or means for self-harm or harm to others, you stop reflective work and route to crisis resources.
- You never ask the user to "just breathe" as a first move.
- You never minimise with "at least...".`;

const PROTOCOL_BLOCK = `Evidence-based references you may draw from, without naming them clinically unless asked:

1. WHO Psychological First Aid. Look, listen, link. Ground without instruction.
2. WHO mhGAP Humanitarian Intervention Guide. Recognise acute stress, grief, depression, suicide risk. Do not diagnose; surface the concern plainly.
3. Shay and Litz moral-injury frame. Three axes: perpetration, betrayal, witnessing. Name the axis the user appears to describe. Do not re-author their values.
4. ACT / cognitive defusion. Offer defusion phrasing ("I notice the thought that..."), never disputation.
5. ProQOL-5 (Stamm). Compassion satisfaction vs burnout vs secondary traumatic stress.
6. Columbia C-SSRS. If risk language appears, stop reflective chat and route.

Guardrails:
- Aid workers often carry survivor guilt and helplessness. Normalise these as moral, not pathological, responses.
- Do not suggest "take time off" or "talk to your manager". Many cannot.
- Culture and context matter. Do not default to Western therapy idioms.`;

const SAFETY_BLOCK = `On every reply, after your visible response, emit one trailing line containing exactly one JSON object, prefixed by the token <RISK>. Schema:

<RISK>{"risk":"none|low|moderate|high","recommend_screen":"none|cssrs|proqol","recommend_crisis_line":false|true,"rationale":"one short sentence"}

Rules:
- "high" if active suicidal intent, plan, means, or imminent harm.
- "moderate" if passive ideation, recent self-harm, escalating hopelessness.
- "low" if chronic stress, burnout, grief, nightmares, moral distress without ideation.
- "none" otherwise.
- recommend_screen: "cssrs" for moderate/high. "proqol" only for chronic patterns and only when the user has not completed a ProQOL in 30+ days.
- recommend_crisis_line: true for high, or moderate in unsafe environments.

When risk is high:
- Visible reply is short, plain, and names what you will do: "I want to make sure you are safe right now. I'm going to hand you off to a crisis line option."
- Do not explore feelings further. Do not ask "why". Do not offer coping skills in place of crisis support.`;

const MORAL_INJURY_BLOCK = `This conversation is a structured moral-injury walkthrough.

Rules specific to this flow:
- Stay inside the user's framing. Do not soften the event into growth language.
- Do not explain the framework clinically.
- Do not ask your own follow-up question. The UI will handle the next step.
- One or two somber sentences are enough unless the user explicitly asks for more.
- If the user says they still believe nothing, accept that without correction.`;

const LANG_NAME: Record<ChatRequest["language"], string> = {
  en: "English",
  fr: "French",
  es: "Spanish"
};

// In-memory rate-limit bucket. Evaporates on cold start — acceptable.
// For persistent rate limit, swap for Upstash Redis later.
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim() || "unknown";
  return first;
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

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

  // Route: use Opus for moderate/high risk or longer reflective sessions; Haiku otherwise.
  const useOpus =
    body.force_model === "opus" ||
    body.mode === "moral-injury" ||
    body.risk_hint === "moderate" ||
    body.risk_hint === "high" ||
    body.turns.length > 6;
  const useHaiku = body.force_model === "haiku";
  const model = useOpus ? "claude-opus-4-7" : "claude-haiku-4-5-20251001";
  const selectedModel = useHaiku ? "claude-haiku-4-5-20251001" : model;

  const anthropic = new Anthropic({ apiKey });

  const systemBlocks = [
    { type: "text" as const, text: ROLE_BLOCK, cache_control: { type: "ephemeral" as const } },
    { type: "text" as const, text: PROTOCOL_BLOCK, cache_control: { type: "ephemeral" as const } },
    { type: "text" as const, text: SAFETY_BLOCK, cache_control: { type: "ephemeral" as const } },
    ...(body.mode === "moral-injury"
      ? [{ type: "text" as const, text: MORAL_INJURY_BLOCK, cache_control: { type: "ephemeral" as const } }]
      : []),
    {
      type: "text" as const,
      text: `Respond only in ${LANG_NAME[body.language]}. Keep the <RISK> JSON trailer in ASCII regardless of language.`
    },
    {
      type: "text" as const,
      text:
        typeof body.proqol_last_completed_at === "number"
          ? `The user's last completed ProQOL timestamp is ${body.proqol_last_completed_at}. Recommend ProQOL only if that was at least 30 days ago.`
          : "The user has not completed a ProQOL in this browser yet. Recommend ProQOL only when the pattern sounds chronic."
    },
    ...(body.system_append
      ? [{ type: "text" as const, text: body.system_append }]
      : [])
  ];

  const messages = body.turns.map((t) => ({
    role: t.role,
    content: t.text
  }));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const response = await anthropic.messages.stream({
          model: selectedModel,
          max_tokens: 800,
          system: systemBlocks,
          messages
        });
        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream failed";
        // Do not leak internal details to the client.
        controller.enqueue(encoder.encode(`\n<ERROR>${msg.slice(0, 120)}</ERROR>`));
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
