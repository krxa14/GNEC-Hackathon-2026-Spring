import { useEffect, useMemo, useRef, useState } from "react";
import { proqolItems, scoreProQOL, type ProQOLScore } from "./proqol";
import { saveProQOLResult } from "../storage/proqol";
import { saveLogbookEntry } from "../storage/logbook";
import { useStore } from "../store";
import { t } from "../i18n";
import { useDialogFocusTrap } from "../ui/useDialogFocusTrap";

type ProQOLFlowProps = {
  open: boolean;
  onClose: () => void;
  onRouteToCheckIn: () => void;
  onCompleted: (completedAt: number) => void;
};

const OPTIONS = [1, 2, 3, 4, 5] as const;

export function ProQOLFlow({
  open,
  onClose,
  onRouteToCheckIn,
  onCompleted
}: ProQOLFlowProps) {
  const lang = useStore((s) => s.language);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<ProQOLScore | null>(null);
  const [note, setNote] = useState("");
  const [logbookSaved, setLogbookSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setAnswers({});
      setIndex(0);
      setScore(null);
      setNote("");
      setLogbookSaved(false);
    }
  }, [open]);

  useDialogFocusTrap({ open, containerRef, onClose });

  const item = proqolItems[index];
  const progress = useMemo(
    () =>
      t(lang, "proqolProgress")
        .replace("{current}", String(index + 1))
        .replace("{total}", String(proqolItems.length)),
    [index, lang]
  );

  if (!open) return null;

  async function choose(value: number) {
    const nextAnswers = { ...answers, [item.id]: value };
    if (index === proqolItems.length - 1) {
      const nextScore = scoreProQOL(nextAnswers);
      const completedAt = Date.now();
      await saveProQOLResult(nextScore, completedAt);
      onCompleted(completedAt);
      setAnswers(nextAnswers);
      setScore(nextScore);
      return;
    }
    setAnswers(nextAnswers);
    setIndex((current) => current + 1);
  }

  function interpretation(scoreValue: ProQOLScore): string[] {
    const lines: string[] = [];
    lines.push(
      `${t(lang, "proqolCSLabel")}: ${scoreValue.CS} — ${
        scoreValue.CS >= 23 ? t(lang, "proqolCSHigh") : t(lang, "proqolCSLow")
      }`
    );
    lines.push(
      `${t(lang, "proqolBOLabel")}: ${scoreValue.BO} — ${
        scoreValue.BO >= 23 ? t(lang, "proqolBOHigh") : t(lang, "proqolBOLow")
      }`
    );
    lines.push(
      `${t(lang, "proqolSTSLabel")}: ${scoreValue.STS} — ${
        scoreValue.STS >= 23 ? t(lang, "proqolSTSHigh") : t(lang, "proqolSTSLow")
      }`
    );
    return lines;
  }

  const needsFollowUp = score ? score.BO >= 23 || score.STS >= 23 : false;

  function saveToLogbook(scoreValue: ProQOLScore) {
    const now = Date.now();
    const scoreText = interpretation(scoreValue).join("\n");
    const turns: { role: "user" | "assistant"; text: string; createdAt: number }[] = [
      { role: "assistant", text: scoreText, createdAt: now }
    ];
    if (note.trim()) {
      turns.push({ role: "user", text: note.trim(), createdAt: now });
    }
    const preview = note.trim()
      ? note.trim().slice(0, 120)
      : `CS: ${scoreValue.CS} · BO: ${scoreValue.BO} · STS: ${scoreValue.STS}`;
    saveLogbookEntry({
      id: Math.random().toString(36).slice(2) + now.toString(36),
      savedAt: now,
      sessionType: "ProQOL-5 Screen",
      preview,
      turns
    });
    setLogbookSaved(true);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proqol-flow-title"
      className="fixed inset-0 z-40 overflow-y-auto bg-black/80 px-5 py-6"
    >
      <div className="mx-auto flex min-h-full max-w-2xl items-center">
        <div ref={containerRef} tabIndex={-1} className="panel w-full space-y-5 outline-none">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-soft">{t(lang, "proqolEyebrow")}</p>
            <h2 id="proqol-flow-title" className="text-2xl leading-tight">
              {t(lang, "proqolTitle")}
            </h2>
            {!score ? <p className="text-xs uppercase tracking-[0.2em] text-ink-300">{progress}</p> : null}
          </div>

          {!score ? (
            <p className="text-xs text-ink-400 leading-relaxed border-l-2 border-ink-700 pl-3">
              This reflection screener draws on the ProQOL framework — a validated tool used to measure compassion satisfaction, burnout, and secondary traumatic stress in humanitarian and caregiving workers. It is not diagnostic. Your answers stay on this device and are never sent anywhere.
            </p>
          ) : null}

          {score ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-ink-700 bg-ink-950 px-4 py-4">
                {interpretation(score).map((line) => (
                  <p key={line} className="text-sm leading-relaxed text-ink-200">
                    {line}
                  </p>
                ))}
              </div>

              {needsFollowUp ? (
                <p className="text-sm leading-relaxed text-ink-300">{t(lang, "proqolFollowUp")}</p>
              ) : (
                <p className="text-sm leading-relaxed text-ink-300">{t(lang, "proqolComplete")}</p>
              )}

              <div className="space-y-2">
                <p className="text-xs text-ink-300">{t(lang, "proqolNotePrompt")}</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder={t(lang, "proqolNotePlaceholder")}
                  className="w-full bg-transparent border border-ink-700 rounded-xl px-3 py-2 text-sm outline-none resize-none placeholder:text-ink-400"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {needsFollowUp ? (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      onClose();
                      onRouteToCheckIn();
                    }}
                  >
                    {t(lang, "proqolRouteToCheckIn")}
                  </button>
                ) : null}
                <button
                  className="btn !px-4 !py-2 text-sm bg-ink-900 border border-accent/70 text-accent hover:border-accent hover:bg-ink-800"
                  onClick={() => saveToLogbook(score)}
                  disabled={logbookSaved}
                >
                  {logbookSaved ? "Saved." : t(lang, "proqolSaveLogbook")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-lg leading-relaxed">{item.text}</p>
                <p className="text-sm text-ink-300">{t(lang, "proqolScaleHelp")}</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {OPTIONS.map((value) => (
                  <button key={value} className="btn-ghost" onClick={() => void choose(value)}>
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button className="btn-ghost" onClick={onClose}>
                  {t(lang, "proqolClose")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
