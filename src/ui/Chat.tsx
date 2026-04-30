import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { streamChat, serializeHistory } from "../ai/client";
import { parseRiskTrailer, preFilter, escalate } from "../ai/safety";
import { t } from "../i18n";
import { CSSRSFlow } from "../screeners/CSSRSFlow";
import { ProQOLFlow } from "../screeners/ProQOLFlow";
import { CrisisModal } from "./CrisisModal";
import { getLastProQOLTimestamp } from "../storage/proqol";

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

const RISK_TOKEN = "<RISK>";

// Deterministic guards — prevent local model from hallucinating context on simple inputs.
// These return without calling the model at all.
const GREETING_GUARD: Record<string, string> = {
  // Greetings — never reach the model
  hi:                  "Hi. I'm here with you. What do you want to put down today?",
  hello:               "Hi. I'm here with you. What do you want to put down today?",
  hey:                 "Hi. I'm here with you. What do you want to put down today?",
  yo:                  "Hi. I'm here with you. What do you want to put down today?",
  "good morning":      "Hi. I'm here with you. What do you want to put down today?",
  "good afternoon":    "Hi. I'm here with you. What do you want to put down today?",
  "good evening":      "Hi. I'm here with you. What do you want to put down today?",
  // Low-content deflection
  nothing:             "Okay. We can keep this light. What would help right now — clear your head, sleep, or just write one sentence?",
  "nothing much":      "Okay. We can keep this light. What would help right now — clear your head, sleep, or just write one sentence?",
  "not much":          "Okay. We can keep this light. What would help right now — clear your head, sleep, or just write one sentence?",
  // "I'm good" variants
  "im good":           "Good. We can leave it there, or you can write one small thing you want to let go of before moving on.",
  "i'm good":          "Good. We can leave it there, or you can write one small thing you want to let go of before moving on.",
  "i am good":         "Good. We can leave it there, or you can write one small thing you want to let go of before moving on.",
  "no im good":        "Good. We can leave it there, or you can write one small thing you want to let go of before moving on.",
  "no i'm good":       "Good. We can leave it there, or you can write one small thing you want to let go of before moving on.",
  fine:                "Good. We can leave it there, or you can write one small thing you want to let go of before moving on.",
  ok:                  "Okay. What brought you here today?",
  okay:                "Okay. What brought you here today?",
};

function stripStreamingTrailer(buffer: string): string {
  const marker = buffer.indexOf(RISK_TOKEN);
  if (marker >= 0) return buffer.slice(0, marker);

  for (let size = RISK_TOKEN.length - 1; size > 0; size -= 1) {
    if (buffer.endsWith(RISK_TOKEN.slice(0, size))) {
      return buffer.slice(0, -size);
    }
  }

  return buffer;
}

export function Chat({
  onOpenMoralInjury,
  onOpenSleep
}: {
  onOpenMoralInjury: () => void;
  onOpenSleep: () => void;
}) {
  const lang = useStore((s) => s.language);
  const turns = useStore((s) => s.turns);
  const isStreaming = useStore((s) => s.isStreaming);
  const append = useStore((s) => s.append);
  const patchLast = useStore((s) => s.patchLast);
  const setStreaming = useStore((s) => s.setStreaming);
  const resetTurns = useStore((s) => s.reset);
  const setSessionId = useStore((s) => s.setSessionId);
  const [draft, setDraft] = useState("");
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [isCSSRSOpen, setIsCSSRSOpen] = useState(false);
  const [isProQOLOpen, setIsProQOLOpen] = useState(false);
  const [isUrgentCrisis, setIsUrgentCrisis] = useState(false);
  const [lastProQOLCompletedAt, setLastProQOLCompletedAt] = useState<number | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void getLastProQOLTimestamp().then(setLastProQOLCompletedAt);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isStreaming, turns]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const viewport = window.visualViewport;

    const updateInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset);
    };

    updateInset();
    viewport.addEventListener("resize", updateInset);
    viewport.addEventListener("scroll", updateInset);
    return () => {
      viewport.removeEventListener("resize", updateInset);
      viewport.removeEventListener("scroll", updateInset);
    };
  }, []);

  function openCrisisModal(urgent: boolean) {
    setIsUrgentCrisis(urgent);
    setIsCSSRSOpen(false);
    setIsCrisisOpen(true);
  }

  async function sendText(rawText?: string) {
    const text = (rawText ?? draft).trim();
    if (!text || isStreaming) return;

    // ── DETERMINISTIC GUARD ──────────────────────────────────────────────────
    // Must run FIRST — before preFilter, before API, before any state change.
    // Prevents local models from hallucinating context on low-content inputs.
    const normalized = text.toLowerCase();
    const guardResponse = GREETING_GUARD[normalized];
    if (guardResponse) {
      console.log("DETERMINISTIC_GUARD_HIT", normalized);
      setDraft("");
      append({ id: id(), role: "user",      text,          createdAt: Date.now(), risk: "none" });
      append({ id: id(), role: "assistant", text: guardResponse, createdAt: Date.now(), risk: "none" });
      return; // no API call
    }
    // ────────────────────────────────────────────────────────────────────────

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
      setIsCSSRSOpen(true);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      append({
        id: id(),
        role: "assistant",
        text:
          "You're offline. Your words are saved here. The AI response will resume when the connection returns.",
        createdAt: Date.now()
      });
      return;
    }

    const history = serializeHistory(useStore.getState().turns);
    append({ id: id(), role: "assistant", text: "", createdAt: Date.now() });
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      let streamed = "";
      const full = await streamChat(
        {
          language: lang,
          turns: history,
          risk_hint: preHint,
          proqol_last_completed_at: lastProQOLCompletedAt
        },
        (chunk) => {
          streamed += chunk;
          patchLast({ text: stripStreamingTrailer(streamed).trimEnd() });
        },
        abortRef.current.signal
      );
      const { text: visible, risk } = parseRiskTrailer(full);
      const nextRisk = risk ? escalate(preHint, risk.risk) : preHint;
      patchLast({
        text: visible,
        risk: nextRisk
      });
      if (risk?.risk === "high" || risk?.recommend_crisis_line) {
        openCrisisModal(risk?.risk === "high");
      } else if (risk?.recommend_screen === "cssrs") {
        setIsCSSRSOpen(true);
      } else if (risk?.recommend_screen === "proqol") {
        setIsProQOLOpen(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const isCloudFailure =
        message === "rate_limited" ||
        message === "server_misconfigured" ||
        message === "proxy_failed";
      patchLast({
        text: isCloudFailure
          ? "ShadowFile's full AI mode is designed to run locally for privacy and reliability.\n\nTo run the complete version:\n\ngit clone https://github.com/krxa14/GNEC-Hackathon-2026-Spring\ncd GNEC-Hackathon-2026-Spring\nbash start.sh\n\nNo API key required. No token limits."
          : "The connection dropped. Your words stayed on this device. You can try again when the network returns."
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  async function send() {
    await sendText();
  }

  function endAndSave() {
    // Current turns already persisted to IndexedDB on every message.
    // Generate new sessionId so next conversation saves separately.
    const now = new Date();
    const label = now.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      + " · "
      + now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    setSavedLabel(`Saved ${label}`);

    const newId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    setSessionId(newId);
    resetTurns();

    // Clear label after 4 s
    setTimeout(() => setSavedLabel(null), 4000);
  }

  function exportSession() {
    if (turns.length === 0) return;
    const now = new Date();
    const header = `ShadowFile session — ${now.toLocaleString()}\n${"─".repeat(40)}\n\n`;
    const body = turns
      .map((turn) => `[${turn.role === "user" ? "You" : "ShadowFile"}]\n${turn.text}`)
      .join("\n\n");
    const blob = new Blob([header + body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shadowfile-${now.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 scroll-smooth" role="log" aria-live="polite" aria-relevant="additions text">
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
        <div ref={endRef} />
      </div>

      <CSSRSFlow
        open={isCSSRSOpen}
        onClose={() => setIsCSSRSOpen(false)}
        onOpenCrisisModal={openCrisisModal}
      />
      <ProQOLFlow
        open={isProQOLOpen}
        onClose={() => setIsProQOLOpen(false)}
        onRouteToCheckIn={() => setDraft("")}
        onCompleted={(completedAt) => setLastProQOLCompletedAt(completedAt)}
      />
      <CrisisModal
        open={isCrisisOpen}
        urgent={isUrgentCrisis}
        onClose={() => {
          setIsCrisisOpen(false);
          setIsUrgentCrisis(false);
        }}
      />

      <div
        className="sticky bottom-0 bg-ink-950 pt-2"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + ${keyboardInset}px)` }}
      >
        <div className="panel">
          <div className="mb-3 flex flex-wrap gap-2 items-center">
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={onOpenMoralInjury}>
              {t(lang, "moralEntry")}
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={onOpenSleep}>
              {t(lang, "sleepEntry")}
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={() => setIsProQOLOpen(true)}>
              {t(lang, "proqolEntry")}
            </button>
            {turns.length > 0 ? (
              <div className="ml-auto flex items-center gap-3">
                {savedLabel ? (
                  <span className="text-[9px] tracking-[0.12em] text-ink-500">{savedLabel}</span>
                ) : null}
                <button
                  className="text-[10px] tracking-[0.15em] uppercase text-ink-600 hover:text-ink-300 transition-colors"
                  onClick={exportSession}
                  type="button"
                  title="Download session as .txt"
                >
                  Export
                </button>
                <button
                  className="text-[10px] tracking-[0.15em] uppercase text-ink-600 hover:text-ink-300 transition-colors"
                  onClick={endAndSave}
                  type="button"
                  title="Save this session and start a new one"
                >
                  End & save
                </button>
              </div>
            ) : null}
          </div>
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
