import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { streamChat, serializeHistory } from "../ai/client";
import { parseRiskTrailer, preFilter, escalate } from "../ai/safety";
import { t } from "../i18n";
import { CSSRSFlow } from "../screeners/CSSRSFlow";
import { ProQOLFlow } from "../screeners/ProQOLFlow";
import { CrisisModal } from "./CrisisModal";
import { getLastProQOLTimestamp } from "../storage/proqol";
import { isSTTSupported, startListening } from "../voice/stt";
import { cancel, speak } from "../voice/tts";

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

const RISK_TOKEN = "<RISK>";

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
  const incrementEntry = useStore((s) => s.incrementEntry);
  const [draft, setDraft] = useState("");
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [isCSSRSOpen, setIsCSSRSOpen] = useState(false);
  const [isProQOLOpen, setIsProQOLOpen] = useState(false);
  const [isUrgentCrisis, setIsUrgentCrisis] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("shadowfile.voice.muted") === "1";
  });
  const [lastProQOLCompletedAt, setLastProQOLCompletedAt] = useState<number | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const lastSpokenTurnRef = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void getLastProQOLTimestamp().then(setLastProQOLCompletedAt);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("shadowfile.voice.muted", isMuted ? "1" : "0");
    }
    if (isMuted) cancel();
  }, [isMuted]);

  useEffect(() => {
    if (isStreaming || isMuted || turns.length === 0) return;
    const lastTurn = turns[turns.length - 1];
    if (lastTurn.role !== "assistant" || !lastTurn.text.trim()) return;
    if (lastSpokenTurnRef.current === lastTurn.id) return;
    lastSpokenTurnRef.current = lastTurn.id;
    const voiceLang = lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-US";
    speak(lastTurn.text, voiceLang);
  }, [isMuted, isStreaming, lang, turns]);

  useEffect(
    () => () => {
      stopListeningRef.current?.();
      cancel();
    },
    []
  );

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
      incrementEntry();
      if (risk?.risk === "high" || risk?.recommend_crisis_line) {
        openCrisisModal(risk?.risk === "high");
      } else if (risk?.recommend_screen === "cssrs") {
        setIsCSSRSOpen(true);
      } else if (risk?.recommend_screen === "proqol") {
        setIsProQOLOpen(true);
      }
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

  async function send() {
    await sendText();
  }

  function onMic() {
    if (isListening) {
      stopListeningRef.current?.();
      stopListeningRef.current = null;
      setIsListening(false);
      return;
    }

    const voiceLang = lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-US";
    setIsListening(true);
    stopListeningRef.current = startListening(
      (text) => {
        setDraft(text);
        void sendText(text);
      },
      () => {
        setIsListening(false);
        stopListeningRef.current = null;
      },
      voiceLang
    );
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
          <div className="mb-3 flex flex-wrap gap-2">
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={onOpenMoralInjury}>
              {t(lang, "moralEntry")}
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={onOpenSleep}>
              {t(lang, "sleepEntry")}
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={() => setIsProQOLOpen(true)}>
              {t(lang, "proqolEntry")}
            </button>
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
            <div className="flex items-center gap-2">
              <span>Cmd/Ctrl + Enter</span>
              {isSTTSupported() ? (
                <button className="btn-ghost !px-3 !py-2" onClick={onMic} type="button">
                  {isListening ? t(lang, "voiceListening") : t(lang, "voiceMic")}
                </button>
              ) : null}
              <button
                className="btn-ghost !px-3 !py-2"
                onClick={() => setIsMuted((value) => !value)}
                type="button"
              >
                {isMuted ? t(lang, "voiceMuted") : t(lang, "voiceSpeaking")}
              </button>
            </div>
            <button className="btn-primary" onClick={() => void send()} disabled={isStreaming}>
              {t(lang, "send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
