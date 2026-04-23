import { useState } from "react";
import { useStore } from "../store";
import { t } from "../i18n";

export function CrisisFooter() {
  const lang = useStore((s) => s.language);
  const [open, setOpen] = useState(false);

  return (
    <footer className="sticky bottom-0 border-t border-ink-800 bg-ink-950/95 backdrop-blur px-5 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <p className="text-xs text-ink-300">{t(lang, "crisisFooter")}</p>
        <button className="btn-alert text-xs px-3 py-2" onClick={() => setOpen(true)}>
          {t(lang, "crisisCta")}
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"
          onClick={() => setOpen(false)}
        >
          <div
            className="panel max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-serif">You asked for help.</h2>
            <p className="text-sm text-ink-300">
              Day 3 will load your country's crisis line from public/crisis-lines.json and
              offer a one-tap call + a one-tap message to your configured trusted contact.
            </p>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
