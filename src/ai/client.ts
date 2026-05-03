import type { Language } from "../i18n";
import type { Turn } from "../store";

export type ChatRequest = {
  language: Language;
  turns: Array<{ role: "user" | "assistant"; text: string }>;
  risk_hint: "none" | "low" | "moderate" | "high";
  mode?: "chat" | "moral-injury";
  force_model?: "auto" | "opus" | "haiku";
  system_append?: string;
  proqol_last_completed_at?: number | null;
};

export async function streamChat(
  req: ChatRequest,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal
  });
  if (!res.ok || !res.body) {
    const errorText = await res.text().catch(() => "");
    if (res.status === 429 || res.status === 503) {
      throw new Error("rate_limited");
    }
    if (res.status === 500 && /OPENROUTER_API_KEY|Anthropic keys are no longer supported/i.test(errorText)) {
      throw new Error("server_misconfigured");
    }
    if (res.status === 401 || res.status === 403 || res.status === 502) {
      throw new Error("proxy_failed");
    }
    throw new Error(`Proxy error ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onDelta(chunk);
  }
  return full;
}

export function serializeHistory(turns: Turn[]): ChatRequest["turns"] {
  // Exclude error turns — they're UI messages, not real conversation content.
  // Keep the last 6 real turns to keep prompt short and cache hits high.
  return turns
    .filter((t) => !t.isError)
    .slice(-6)
    .map((t) => ({ role: t.role, text: t.text }));
}
