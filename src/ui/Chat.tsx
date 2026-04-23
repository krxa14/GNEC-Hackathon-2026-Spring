import { useRef, useState } from "react";
import { useStore } from "../store";
import { streamChat, serializeHistory } from "../ai/client";
import { parseRiskTrailer, preFilter, escalate } from "../ai/safety";
import { t } from "../i18n";

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function Chat() {
  const lang = useStore((s) => s.language);
  const turns = useStore((s) => s.turns);
  const isStreaming = useStore((s) => s.isStreaming);
  const append = useStore((s) => s.append);
  const patchLast = useStore((s) => s.patchLast);
  const setStreaming = useStore((s) => s.setStreaming);
  const [draft, setDraft] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function send() {
    const text = draft.trim();
    if (!text || isStreaming) return;
    setDraft("");

    const preHint = preFilter(text);
    append({ id: id(), role: "user", text, createdAt: Date.now(), risk: preHint });

    // If pre-filter catches high risk, short-circuit the API and route to the C-SSRS flow.
    if (preHint === "high") {
      append({
        id: id(),
        role: "assistant",
        text:
          "I want to make sure you are safe right now. I am going to stop reflecting and offer you a crisis screen and line.",
        createdAt: Date.now(),
        risk: "high"
      });
      // Day 3 wires the C-SSRS modal here.
      return;
    }

    const history = serializeHistory(useStore.getState().turns);
    append({ id: id(), role: "assistant", text: "", createdAt: Date.now() });
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const full = await streamChat(
        { language: lang, turns: history, risk_hint: preHint },
        (chunk) => {
          const current = useStore.getState().turns[useStore.getState().turns.length - 1]?.text ?? "";
          patchLast({ text: current + chunk });
        },
        abortRef.current.signal
      );
      const { text: visible, risk } = parseRiskTrailer(full);
      patchLast({
        text: visible,
        risk: risk ? escalate(preHint, risk.risk) : preHint
      });
    } catch (err) {
      patchLast({
        text:
          "The connection dropped. Your words stayed on this device. You can try again when the network returns."
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={
              turn.role === "user"
                ? "panel !bg-ink-800"
                : "panel"
            }
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
              {turn.role === "user" ? "You" : "ShadowFile"}
              {turn.risk && turn.risk !== "none" ? (
                <span
                  className={
                    "ml-2 " +
                    (turn.risk === "high"
                      ? "text-alert"
                      : turn.risk === "moderate"
                      ? "text-accent"
                      : "text-accent-soft")
                  }
                >
                  risk: {turn.risk}
                </span>
              ) : null}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{turn.text || "…"}</div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-ink-950 pt-2">
        <div className="panel">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void send();
              }
            }}
            rows={3}
            placeholder={t(lang, "chatPlaceholder")}
            className="w-full bg-transparent outline-none resize-none placeholder:text-ink-300"
          />
          <div className="flex justify-between items-center mt-3 text-xs text-ink-300">
            <span>Cmd/Ctrl + Enter</span>
            <button className="btn-primary" onClick={() => void send()} disabled={isStreaming}>
              {t(lang, "send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
