import { useMemo, useRef, useState } from "react";
import { hasThreeConsecutiveHardNights, saveSleepEntry } from "../storage/sleep";
import { saveLogbookEntry } from "../storage/logbook";
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
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
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

  function saveAndClose() {
    if (!selected) return;
    const now = Date.now();
    const acknowledgment = threeHardNights
      ? t(lang, "sleepThreeHardNights")
      : selected <= 2
      ? t(lang, "sleepLowAcknowledgment")
      : t(lang, "sleepAcknowledgment");
    const turns: { role: "user" | "assistant"; text: string; createdAt: number }[] = [
      { role: "user", text: `Sleep quality: ${selected}/5`, createdAt: now },
      { role: "assistant", text: acknowledgment, createdAt: now }
    ];
    if (note.trim()) {
      turns.push({ role: "user", text: note.trim(), createdAt: now });
    }
    const preview = note.trim()
      ? note.trim().slice(0, 120)
      : `Sleep quality: ${selected}/5`;
    saveLogbookEntry({
      id: Math.random().toString(36).slice(2) + now.toString(36),
      savedAt: now,
      sessionType: "Sleep Check-In",
      preview,
      turns
    });
    setSaved(true);
    onClose();
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

              <div className="space-y-2">
                <p className="text-xs text-ink-300">{t(lang, "sleepNotePrompt")}</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder={t(lang, "sleepNotePlaceholder")}
                  className="w-full bg-transparent border border-ink-700 rounded-xl px-3 py-2 text-sm outline-none resize-none placeholder:text-ink-400"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="btn !px-4 !py-2 text-sm bg-ink-900 border border-accent/70 text-accent hover:border-accent hover:bg-ink-800"
                  onClick={saveAndClose}
                >
                  {saved ? "Saved." : t(lang, "sleepSaveClose")}
                </button>
                <button className="btn-ghost" onClick={() => setShowGrounding((v) => !v)}>
                  {showGrounding ? t(lang, "sleepHideGrounding") : t(lang, "sleepShowGrounding")}
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
