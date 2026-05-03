import { useEffect, useRef, useState } from "react";
import { useStore, type Turn } from "../store";
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

const SESSION_TYPE = "Offshift Check-In";
const FALLBACK_TEXT = "Noted. I saved this session. You can return to it later from the logbook.";

function getFirstUserMemo(turns: Turn[]): string {
  return turns.find((turn) => turn.role === "user")?.text.trim() ?? "";
}

function getPreview(text: string): string {
  return text.length > 120 ? text.slice(0, 117) + "…" : text;
}

function getSessionSaveKey(sessionType: string, firstUserMemo: string, savedAt: number): string | null {
  const normalizedMemo = firstUserMemo.trim().toLowerCase();
  if (!normalizedMemo) return null;
  const minuteBucket = Math.floor(savedAt / 60000);
  return `${sessionType}|${normalizedMemo}|${minuteBucket}`;
}

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
  const [sending, setSending] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const sendingRef = useRef(false);
  const savedSessionKeysRef = useRef(new Set<string>());

  useEffect(() => {
    void getLastProQOLTimestamp().then(setLastProQOLCompletedAt);
  }, []);

  // Auto-save chat session to logbook when tab is closed or refreshed
  useEffect(() => {
    function handleBeforeUnload() {
      const { turns } = useStore.getState();
      const saveable = turns.filter((t) => !t.isError);
      if (!saveable.some((t) => t.role === "user")) return;
      const firstUserText = saveable.find((t) => t.role === "user")?.text ?? "";
      const preview = firstUserText.length > 120
        ? firstUserText.slice(0, 117) + "…"
        : firstUserText;
      saveLogbookEntry({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        savedAt: Date.now(),
        sessionType: "Offshift Check-In",
        preview,
        turns: saveable.map((t) => ({ role: t.role, text: t.text, createdAt: t.createdAt }))
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

  function saveVisibleSessionOnce(sessionTurns: Turn[] = useStore.getState().turns): boolean {
    if (!sessionTurns.some((turn) => turn.role === "user")) return false;

    const firstUserMemo = getFirstUserMemo(sessionTurns);
    if (!firstUserMemo) return false;

    const savedAt = Date.now();
    const saveKey = getSessionSaveKey(SESSION_TYPE, firstUserMemo, savedAt);
    if (saveKey && savedSessionKeysRef.current.has(saveKey)) {
      return true;
    }

    saveLogbookEntry({
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      savedAt,
      sessionType: SESSION_TYPE,
      preview: getPreview(firstUserMemo),
      turns: sessionTurns.map((turn) => ({
        role: turn.role,
        text: turn.text,
        createdAt: turn.createdAt,
      })),
    });

    if (saveKey) {
      savedSessionKeysRef.current.add(saveKey);
    }

    return true;
  }

  function ensureFallbackAssistantTurn(): Turn[] {
    const currentTurns = useStore.getState().turns;
    const lastTurn = currentTurns[currentTurns.length - 1];

    if (lastTurn?.role === "assistant") {
      if (lastTurn.text === FALLBACK_TEXT) {
        return currentTurns;
      }

      patchLast({
        text: FALLBACK_TEXT,
        isError: true,
        risk: "none",
      });
      return useStore.getState().turns;
    }

    append({
      id: id(),
      role: "assistant",
      text: FALLBACK_TEXT,
      createdAt: Date.now(),
      isError: true,
      risk: "none",
    });
    return useStore.getState().turns;
  }

  function autosaveFallbackSession() {
    const nextTurns = ensureFallbackAssistantTurn();
    if (saveVisibleSessionOnce(nextTurns)) {
      setSavedLabel("Saved to Shadow Logbook.");
      setTimeout(() => setSavedLabel(null), 4000);
    }
  }

  async function sendMessage(rawText?: string) {
    if (sendingRef.current || isStreaming) return;

    const text = (rawText ?? draft).trim();
    if (!text) return;

    sendingRef.current = true;
    setSending(true);
    setDraft("");

    // ── DETERMINISTIC GUARD ──────────────────────────────────────────────────
    // Must run FIRST — before preFilter, before API, before any state change.
    // Prevents local models from hallucinating context on low-content inputs.
    try {
      const normalized = text.toLowerCase();
      const guardResponse = GREETING_GUARD[normalized];
      if (guardResponse) {
        console.log("DETERMINISTIC_GUARD_HIT", normalized);
        append({ id: id(), role: "user", text, createdAt: Date.now(), risk: "none" });
        append({ id: id(), role: "assistant", text: guardResponse, createdAt: Date.now(), risk: "none" });
        return;
      }

      const preHint = preFilter(text);
      append({ id: id(), role: "user", text, createdAt: Date.now(), risk: preHint });

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
        autosaveFallbackSession();
        return;
      }

      const history = serializeHistory(useStore.getState().turns);
      append({ id: id(), role: "assistant", text: "", createdAt: Date.now() });
      setStreaming(true);
      abortRef.current = new AbortController();

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
    } catch {
      autosaveFallbackSession();
    } finally {
      setStreaming(false);
      abortRef.current = null;
      sendingRef.current = false;
      setSending(false);
    }
  }

  function endAndSave() {
    if (!saveVisibleSessionOnce(turns)) {
      setSavedLabel("Nothing to save.");
      setTimeout(() => setSavedLabel(null), 3000);
      return;
    }

    setSavedLabel("Saved to Shadow Logbook.");
    setDraft("");
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
    <div className="flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 md:px-8 py-6 space-y-5">
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
                onClick={() => void sendMessage(chip)}
                disabled={sending || sendingRef.current || isStreaming}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3 scroll-smooth pb-4" role="log" aria-live="polite" aria-relevant="additions text">
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={
              turn.isError
                ? "panel border-ink-700 !bg-ink-800"
                : turn.role === "user"
                ? "panel !bg-ink-800"
                : "panel"
            }
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
              {turn.role === "user" ? "You" : "ShadowFile"}
              {turn.risk && turn.risk !== "none" && !turn.isError ? (
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
            <div className="whitespace-pre-wrap leading-relaxed text-ink-300">
              {turn.text || "…"}
            </div>
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
      </div>{/* end max-w-2xl content area */}

      <div
        className="sticky bottom-0 z-10 bg-ink-950 pt-2"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + ${keyboardInset}px)` }}
      >
        <div className="max-w-2xl mx-auto px-4 md:px-8">
        <div className="panel space-y-3">
          {/* Session controls — always visible first */}
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-700 pb-3">
            <button
              className="btn-ghost !px-3 !py-1.5 text-xs"
              onClick={newSession}
              type="button"
              disabled={sending || sendingRef.current || isStreaming}
            >
              New session
            </button>
            <button
              className="btn !px-3 !py-1.5 text-xs bg-ink-900 border border-accent/70 text-accent hover:border-accent hover:bg-ink-800"
              onClick={endAndSave}
              type="button"
              disabled={sending || sendingRef.current || isStreaming}
            >
              End &amp; save
            </button>
            <button
              className="btn !px-3 !py-1.5 text-xs bg-ink-900 border border-ink-600 text-ink-200 hover:border-ink-400 hover:bg-ink-800"
              onClick={onOpenLogbook}
              type="button"
            >
              Logbook
            </button>
            {savedLabel ? (
              <span className="text-xs text-accent ml-1">{savedLabel}</span>
            ) : null}
          </div>

          {/* Flow shortcuts */}
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={onOpenMoralInjury}>
              {t(lang, "moralEntry")}
            </button>
            <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={onOpenSleep}>
              {t(lang, "sleepEntry")}
            </button>
            <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setIsProQOLOpen(true)}>
              {t(lang, "proqolEntry")}
            </button>
          </div>

          {/* Message input + Send */}
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (sendingRef.current || sending) return;
                  void sendMessage();
                }
              }}
              rows={3}
              placeholder={t(lang, "chatPlaceholder")}
              className="w-full bg-transparent outline-none resize-none placeholder:text-ink-300"
            />
            <div className="flex justify-end">
              <button
                className="btn-primary"
                onClick={() => void sendMessage()}
                disabled={sending || sendingRef.current || !draft.trim()}
              >
                {sending ? "Sending" : "Send"}
              </button>
            </div>
          </div>
        </div>
        </div>{/* end max-w-2xl sticky inner */}
      </div>
    </div>
  );
}
