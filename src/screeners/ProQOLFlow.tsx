import { useEffect, useMemo, useRef, useState } from "react";
import { proqolItems, scoreProQOL, type ProQOLScore } from "./proqol";
import { saveProQOLResult } from "../storage/proqol";
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setAnswers({});
      setIndex(0);
      setScore(null);
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
                <button className="btn-ghost" onClick={onClose}>
                  {t(lang, "proqolClose")}
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
