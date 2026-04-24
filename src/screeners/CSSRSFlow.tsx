import { useEffect, useMemo, useRef, useState } from "react";
import { cssrsItems, scoreCSSRS, type CSSRSAnswer, type CSSRSResult } from "./cssrs";
import { useStore } from "../store";
import { t } from "../i18n";
import { useDialogFocusTrap } from "../ui/useDialogFocusTrap";

type CSSRSFlowProps = {
  open: boolean;
  onClose: () => void;
  onOpenCrisisModal: (urgent: boolean) => void;
  onComplete?: (result: CSSRSResult) => void;
};

export function CSSRSFlow({
  open,
  onClose,
  onOpenCrisisModal,
  onComplete
}: CSSRSFlowProps) {
  const lang = useStore((s) => s.language);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<CSSRSAnswer[]>([]);
  const [result, setResult] = useState<CSSRSResult | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setAnswers([]);
      setResult(null);
    }
  }, [open]);

  useDialogFocusTrap({ open, containerRef, onClose });

  const item = cssrsItems[index];
  const progress = useMemo(
    () =>
      t(lang, "cssrsProgress")
        .replace("{current}", String(index + 1))
        .replace("{total}", String(cssrsItems.length)),
    [index, lang]
  );

  if (!open) return null;

  function submitAnswer(answer: CSSRSAnswer) {
    const nextAnswers = [...answers, answer];
    if (index === cssrsItems.length - 1) {
      const nextResult = scoreCSSRS(nextAnswers);
      setAnswers(nextAnswers);
      setResult(nextResult);
      onComplete?.(nextResult);
      if (nextResult.urgent) {
        onClose();
        onOpenCrisisModal(true);
      }
      return;
    }

    setAnswers(nextAnswers);
    setIndex((current) => current + 1);
  }

  function openLines() {
    onClose();
    onOpenCrisisModal(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cssrs-flow-title"
      className="fixed inset-0 z-40 overflow-y-auto bg-black/80 px-5 py-6"
    >
      <div className="mx-auto flex min-h-full max-w-2xl items-center">
        <div ref={containerRef} tabIndex={-1} className="panel w-full space-y-5 outline-none">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-soft">{progress}</p>
            <h2 id="cssrs-flow-title" className="text-2xl leading-tight">
              {t(lang, "cssrsTitle")}
            </h2>
          </div>

          {result ? (
            result.positive ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-ink-200">{t(lang, "cssrsPositive")}</p>
                <p className="text-sm leading-relaxed text-ink-300">{t(lang, "cssrsOffer")}</p>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-alert" onClick={openLines}>
                    {t(lang, "cssrsOpenCrisis")}
                  </button>
                  <button className="btn-ghost" onClick={onClose}>
                    {t(lang, "cssrsReturn")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-ink-200">{t(lang, "cssrsNegative")}</p>
                <div className="flex justify-end">
                  <button className="btn-ghost" onClick={onClose}>
                    {t(lang, "cssrsReturn")}
                  </button>
                </div>
              </div>
            )
          ) : (
            <>
              <p className="text-lg leading-relaxed">{item.text}</p>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => submitAnswer(true)}>
                  {t(lang, "cssrsYes")}
                </button>
                <button className="btn-ghost" onClick={() => submitAnswer(false)}>
                  {t(lang, "cssrsNo")}
                </button>
              </div>
              <div className="flex justify-end">
                <button className="btn-ghost" onClick={onClose}>
                  {t(lang, "cssrsClose")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
