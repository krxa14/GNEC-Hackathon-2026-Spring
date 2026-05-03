import { useMemo, useState } from "react";
import { parseRiskTrailer, preFilter } from "../ai/safety";
import { streamChat } from "../ai/client";
import { CrisisModal } from "../ui/CrisisModal";
import { useStore } from "../store";
import { t } from "../i18n";
import { saveLogbookEntry } from "../storage/logbook";

type MoralInjuryProps = {
  onBack: () => void;
  onRouteToCheckIn: () => void;
};

type StepId = "nameIt" | "axis" | "cost" | "belief" | "carry";

type Entry = {
  step: StepId;
  prompt: string;
  answer: string;
  reply: string;
};

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

function detectAxisLabel(text: string, lang: "en" | "fr" | "es"): string {
  const sample = text.toLowerCase();
  const betrayalHits = ["leader", "manager", "command", "promised", "abandoned", "betray", "power", "let me down"];
  const perpetrationHits = ["i did", "i chose", "my fault", "i signed", "i ordered", "i left", "i failed them"];
  const betrayalScore = betrayalHits.filter((word) => sample.includes(word)).length;
  const perpetrationScore = perpetrationHits.filter((word) => sample.includes(word)).length;

  if (perpetrationScore > betrayalScore) {
    return lang === "fr"
      ? "Cela ressemble surtout à: j'ai dû vivre avec ce que j'ai fait."
      : lang === "es"
      ? "Esto suena más a: tengo que vivir con lo que hice."
      : "This sounds closest to: I have to live with what I did.";
  }

  if (betrayalScore > 0) {
    return lang === "fr"
      ? "Cela ressemble surtout à: quelqu'un avec du pouvoir vous a laissé tomber."
      : lang === "es"
      ? "Esto suena más a: alguien con poder te dejó caer."
      : "This sounds closest to: someone with power let you down.";
  }

  return lang === "fr"
    ? "Cela ressemble surtout à: vous avez vu quelque chose que vous ne pouviez pas arrêter."
    : lang === "es"
    ? "Esto suena más a: viste algo que no pudiste detener."
    : "This sounds closest to: you saw something you could not stop.";
}

export function MoralInjury({ onBack, onRouteToCheckIn }: MoralInjuryProps) {
  const lang = useStore((s) => s.language);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [crisisUrgent, setCrisisUrgent] = useState(false);
  const [assistantText, setAssistantText] = useState("");
  const [savedToLogbook, setSavedToLogbook] = useState(false);

  const initialText = entries[0]?.answer ?? "";
  const axisLabel = useMemo(() => detectAxisLabel(initialText, lang), [initialText, lang]);
  const currentStep = entries.length as 0 | 1 | 2 | 3 | 4;
  const isComplete = currentStep >= 5;

  const stepMap: Array<{ id: StepId; title: string; prompt: string; systemAppend: string }> = [
    {
      id: "nameIt",
      title: t(lang, "moralNameTitle"),
      prompt: t(lang, "moralNamePrompt"),
      systemAppend:
        "This is the first step of a moral-injury walkthrough. The user has just described something that happened. Acknowledge only what they actually wrote — do not invent, infer, or add any details, events, people, sounds, or context not present in their message. One or two plain sentences maximum. Do not ask a follow-up question. The UI will advance the step."
    },
    {
      id: "axis",
      title: t(lang, "moralAxisTitle"),
      prompt: `${axisLabel} ${t(lang, "moralAxisPrompt")}`,
      systemAppend:
        "This is the axis-confirmation step of a moral-injury walkthrough. Respond briefly to whether the framing fits. Do not invent or add context not written by the user. Do not explain the framework clinically. Do not ask a follow-up question."
    },
    {
      id: "cost",
      title: t(lang, "moralCostTitle"),
      prompt: t(lang, "moralCostPrompt"),
      systemAppend:
        "This is the 'what it cost' step of a moral-injury walkthrough. Reflect with restraint. Do not reframe toward growth. Do not ask a follow-up question."
    },
    {
      id: "belief",
      title: t(lang, "moralBeliefTitle"),
      prompt: t(lang, "moralBeliefPrompt"),
      systemAppend:
        "This is the 'what you still believe' step of a moral-injury walkthrough. If the user says 'nothing', accept it without correction. Do not reframe. Do not ask a follow-up question."
    },
    {
      id: "carry",
      title: t(lang, "moralCarryTitle"),
      prompt: t(lang, "moralCarryPrompt"),
      systemAppend:
        "This is the closing step of a moral-injury walkthrough. Stay short and plain. End with a quiet acknowledgment rather than advice. Do not ask a follow-up question."
    }
  ];

  const step = stepMap[Math.min(currentStep, stepMap.length - 1)];

  async function submit() {
    const answer = draft.trim();
    if (!answer || isStreaming || isComplete) return;

    // Greeting guard — step 1 only. Model must not invent trauma for low-content input.
    if (step.id === "nameIt") {
      const normalized = answer.toLowerCase();
      const greetings = ["hi", "hello", "hey", "yo", "ok", "okay", "nothing", "not much", "fine"];
      if (greetings.includes(normalized)) {
        setEntries((current) => [
          ...current,
          {
            step: step.id,
            prompt: step.prompt,
            answer,
            reply: "Take your time. What happened? Describe as much or as little as you want."
          }
        ]);
        setDraft("");
        return;
      }
    }

    const preHint = preFilter(answer);
    if (preHint === "high") {
      setCrisisUrgent(true);
      setCrisisOpen(true);
      return;
    }

    const flowTurns = entries.flatMap((entry) => [
      {
        role: "user" as const,
        text: `${entry.prompt}\n\n${entry.answer}`
      },
      {
        role: "assistant" as const,
        text: entry.reply
      }
    ]);

    const currentPrompt = step.id === "axis" ? `${axisLabel}\n\n${t(lang, "moralAxisPrompt")}` : step.prompt;
    const nextUserTurn = {
      role: "user" as const,
      text: `${currentPrompt}\n\n${answer}`
    };

    setIsStreaming(true);
    setDraft("");
    setAssistantText("");

    try {
      const full = await streamChat(
        {
          language: lang,
          turns: [...flowTurns, nextUserTurn],
          risk_hint: preHint,
          mode: "moral-injury",
          force_model: "opus",
          system_append: step.systemAppend
        },
        (chunk) => setAssistantText((current) => current + chunk)
      );

      const { text: visible, risk } = parseRiskTrailer(full);
      const newEntries = [
        ...entries,
        { step: step.id, prompt: currentPrompt, answer, reply: visible }
      ];
      setEntries(newEntries);
      setAssistantText("");

      // Auto-save to logbook on completion (step 5 of 5)
      if (currentStep === 4 && !savedToLogbook) {
        const firstAnswer = newEntries[0]?.answer ?? "";
        const preview = firstAnswer.length > 120 ? firstAnswer.slice(0, 117) + "…" : firstAnswer;
        const logTurns = newEntries.flatMap((e) => [
          { role: "user" as const, text: `${e.prompt}\n\n${e.answer}`, createdAt: Date.now() },
          { role: "assistant" as const, text: e.reply, createdAt: Date.now() }
        ]);
        saveLogbookEntry({
          id: Math.random().toString(36).slice(2) + Date.now().toString(36),
          savedAt: Date.now(),
          sessionType: "Moral Injury Walkthrough",
          preview,
          turns: logTurns
        });
        setSavedToLogbook(true);
      }

      if (risk?.risk === "high" || risk?.recommend_crisis_line) {
        setCrisisUrgent(risk?.risk === "high");
        setCrisisOpen(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const isCloudFailure =
        message === "rate_limited" ||
        message === "server_misconfigured" ||
        message === "proxy_failed";
      setAssistantText(
        isCloudFailure
          ? "ShadowFile's full AI mode runs locally for privacy and reliability.\n\nRun it locally:\n\nbash start.sh\n\nNo API key. No token limits."
          : t(lang, "moralError")
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent-soft">
            {t(lang, "moralEyebrow")}
          </p>
          <h1 className="mt-2 text-3xl leading-tight">{t(lang, "moralFlowTitle")}</h1>
        </div>
        <button className="btn-ghost" onClick={onBack}>
          {t(lang, "moralBack")}
        </button>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={id()} className="space-y-3">
            <div className="panel !bg-ink-800">
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
                {t(lang, "moralYou")}
              </div>
              <div className="text-xs text-ink-300 mb-2">{entry.prompt}</div>
              <div className="whitespace-pre-wrap leading-relaxed">{entry.answer}</div>
            </div>
            <div className="panel">
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
                ShadowFile
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{entry.reply}</div>
            </div>
          </div>
        ))}

        {assistantText ? (
          <div className="panel">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
              ShadowFile
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">
              {parseRiskTrailer(assistantText).text || "…"}
            </div>
          </div>
        ) : null}

        {/* Error state: show retry button when assistantText looks like an error and not streaming */}
        {assistantText && !isStreaming && assistantText.toLowerCase().includes("connection") ? (
          <div className="flex gap-3">
            <button className="btn-ghost text-sm" onClick={() => { setAssistantText(""); }}>
              {t(lang, "moralRetry")}
            </button>
          </div>
        ) : null}
      </div>

      {isComplete ? (
        <section className="panel space-y-4">
          <p className="text-sm leading-relaxed text-ink-200">{t(lang, "moralComplete")}</p>
          {savedToLogbook ? (
            <p className="text-xs text-accent-soft tracking-[0.1em]">Saved to Shadow Logbook.</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" onClick={onRouteToCheckIn}>
              {t(lang, "moralRouteToCheckIn")}
            </button>
            <button className="btn-ghost" onClick={onBack}>
              {t(lang, "moralBackHome")}
            </button>
          </div>
        </section>
      ) : (
        <section className="panel space-y-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-ink-300">
              {t(lang, "moralProgress")
                .replace("{current}", String(currentStep + 1))
                .replace("{total}", "5")}
            </div>
            <h2 className="text-xl leading-tight">{step.title}</h2>
            <p className="text-sm leading-relaxed text-ink-300">{step.prompt}</p>
          </div>

          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={5}
            placeholder={t(lang, "moralPlaceholder")}
            className="w-full rounded-2xl border border-ink-600 bg-ink-950 px-4 py-4 text-sm text-ink-100 outline-none resize-none placeholder:text-ink-300"
          />

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => void submit()} disabled={isStreaming}>
              {isComplete ? t(lang, "moralDone") : t(lang, "moralContinue")}
            </button>
            <button className="btn-ghost" onClick={onBack}>
              {t(lang, "moralBack")}
            </button>
          </div>
        </section>
      )}

      <CrisisModal
        open={crisisOpen}
        urgent={crisisUrgent}
        onClose={() => {
          setCrisisOpen(false);
          setCrisisUrgent(false);
        }}
      />
    </div>
  );
}
