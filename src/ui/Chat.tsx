import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { streamChat, serializeHistory } from "../ai/client";
import { parseRiskTrailer, preFilter, escalate } from "../ai/safety";
import { t } from "../i18n";
import { CSSRSFlow } from "../screeners/CSSRSFlow";
import { ProQOLFlow } from "../screeners/ProQOLFlow";
import { CrisisModal } from "./CrisisModal";
import { getLastProQOLTimestamp } from "../storage/proqol";
import { saveLogbookEntry } from "../storage/logbook";

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

const STARTER_CHIPS = [
  "I had a difficult shift.",
  "I keep replaying one moment.",
  "I feel emotionally drained.",
  "I just need to unload.",
];

export function Chat({
  onOpenMoralInjury,
  onOpenSleep,
  onOpenLogbook,
}: {
  onOpenMoralInjury: () => void;
  onOpenSleep: () => void;
  onOpenLogbook: () => void;
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

  // Auto-save chat session to logbook when tab is closed or refreshed
  useEffect(() => {
    function handleBeforeUnload() {
      const { turns } = useStore.getState();
      if (turns.length === 0) return;
      const firstUserText = turns.find((t) => t.role === "user")?.text ?? "";
      const preview = firstUserText.length > 120
        ? firstUserText.slice(0, 117) + "…"
        : firstUserText;
      saveLogbookEntry({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        savedAt: Date.now(),
        sessionType: "Offshift Check-In",
        preview,
        turns: turns.map((t) => ({ role: t.role, text: t.text, createdAt: t.createdAt }))
      });
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
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
    if (turns.length === 0) {
      setSavedLabel("Nothing to save.");
      setTimeout(() => setSavedLabel(null), 3000);
      return;
    }
    const firstUserText = turns.find((t) => t.role === "user")?.text ?? "";
    const preview = firstUserText.length > 120
      ? firstUserText.slice(0, 117) + "…"
      : firstUserText;
    saveLogbookEntry({
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      savedAt: Date.now(),
      sessionType: "Offshift Check-In",
      preview,
      turns: turns.map((t) => ({ role: t.role, text: t.text, createdAt: t.createdAt })),
    });
    setSavedLabel("Saved to Shadow Logbook.");
    const newId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    setSessionId(newId);
    resetTurns();
    setTimeout(() => setSavedLabel(null), 4000);
  }

  function newSession() {
    setDraft("");
    const newId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    setSessionId(newId);
    resetTurns();
  }


  return (
    <div className="space-y-5">
      {turns.length === 0 ? (
        <div className="space-y-4">
          <div className="panel space-y-2">
            <p className="text-sm leading-relaxed text-ink-200">
              A private space to put down what you carried today. Nothing leaves this device.
            </p>
            <p className="text-xs text-ink-400">
              Write freely. The AI companion reflects — it does not diagnose, report, or store your words on any server.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STARTER_CHIPS.map((chip) => (
              <button
                key={chip}
                className="btn-ghost !px-3 !py-2 text-xs"
                onClick={() => void sendText(chip)}
                disabled={isStreaming}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
        <div className="panel space-y-3">
          {/* Flow shortcuts */}
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={onOpenMoralInjury}>
              {t(lang, "moralEntry")}
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={onOpenSleep}>
              {t(lang, "sleepEntry")}
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={() => setIsProQOLOpen(true)}>
              {t(lang, "proqolEntry")}
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={onOpenLogbook}>
              Logbook
            </button>
          </div>

          {/* Message input */}
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

          {/* Session controls + Send */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-ghost !px-4 !py-2 text-sm"
              onClick={newSession}
              type="button"
              title="Clear current chat and start fresh"
            >
              New session
            </button>
            <button
              className="btn !px-4 !py-2 text-sm bg-ink-900 border border-accent/70 text-accent hover:border-accent hover:bg-ink-800"
              onClick={endAndSave}
              type="button"
              title="Save this session to Shadow Logbook and clear"
            >
              End &amp; save
            </button>
            {savedLabel ? (
              <span className="text-xs text-accent ml-1">{savedLabel}</span>
            ) : null}
            <button
              className="btn-primary ml-auto"
              onClick={() => void send()}
              disabled={isStreaming}
            >
              {t(lang, "send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
