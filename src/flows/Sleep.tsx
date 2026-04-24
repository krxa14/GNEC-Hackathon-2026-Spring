import { useMemo, useRef, useState } from "react";
import { hasThreeConsecutiveHardNights, saveSleepEntry } from "../storage/sleep";
import { useStore } from "../store";
import { t } from "../i18n";
import { useDialogFocusTrap } from "../ui/useDialogFocusTrap";

type SleepProps = {
  open: boolean;
  onClose: () => void;
  onRouteToCheckIn: () => void;
};

const RATINGS = [1, 2, 3, 4, 5] as const;

export function Sleep({ open, onClose, onRouteToCheckIn }: SleepProps) {
  const lang = useStore((s) => s.language);
  const [selected, setSelected] = useState<number | null>(null);
  const [showGrounding, setShowGrounding] = useState(false);
  const [threeHardNights, setThreeHardNights] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const groundingLines = useMemo(
    () => [
      t(lang, "sleepGroundingLine1"),
      t(lang, "sleepGroundingLine2"),
      t(lang, "sleepGroundingLine3"),
      t(lang, "sleepGroundingLine4")
    ],
    [lang]
  );

  useDialogFocusTrap({ open, containerRef, onClose });

  if (!open) return null;

  async function submit(rating: number) {
    setSelected(rating);
    setIsSaving(true);
    const entries = await saveSleepEntry(rating);
    setThreeHardNights(rating <= 2 && hasThreeConsecutiveHardNights(entries));
    setIsSaving(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sleep-flow-title"
      className="fixed inset-0 z-40 overflow-y-auto bg-black/80 px-5 py-6"
    >
      <div className="mx-auto flex min-h-full max-w-xl items-center">
        <div ref={containerRef} tabIndex={-1} className="panel w-full space-y-5 outline-none">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-soft">
              {t(lang, "sleepEyebrow")}
            </p>
            <h2 id="sleep-flow-title" className="text-2xl leading-tight">
              {t(lang, "sleepQuestion")}
            </h2>
            <p className="text-sm text-ink-300">{t(lang, "sleepScaleHelp")}</p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {RATINGS.map((rating) => (
              <button
                key={rating}
                className={selected === rating ? "btn-primary" : "btn-ghost"}
                onClick={() => void submit(rating)}
                disabled={isSaving}
              >
                {rating}
              </button>
            ))}
          </div>

          {selected ? (
            <div className="space-y-4 rounded-2xl border border-ink-700 bg-ink-950 px-4 py-4">
              {threeHardNights ? (
                <>
                  <p className="text-sm leading-relaxed text-ink-200">
                    {t(lang, "sleepThreeHardNights")}
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      onClose();
                      onRouteToCheckIn();
                    }}
                  >
                    {t(lang, "sleepRouteToCheckIn")}
                  </button>
                </>
              ) : (
                <p className="text-sm leading-relaxed text-ink-200">
                  {selected <= 2 ? t(lang, "sleepLowAcknowledgment") : t(lang, "sleepAcknowledgment")}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button className="btn-ghost" onClick={() => setShowGrounding((value) => !value)}>
                  {showGrounding ? t(lang, "sleepHideGrounding") : t(lang, "sleepShowGrounding")}
                </button>
                <button className="btn-ghost" onClick={onClose}>
                  {t(lang, "sleepClose")}
                </button>
              </div>
            </div>
          ) : null}

          {showGrounding ? (
            <div className="rounded-2xl border border-ink-700 bg-ink-950 px-4 py-4">
              <div className="text-sm font-medium">{t(lang, "sleepGroundingTitle")}</div>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-300">
                {groundingLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
