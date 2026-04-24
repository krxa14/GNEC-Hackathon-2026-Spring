import { useState } from "react";
import { useStore } from "../store";
import { t } from "../i18n";
import { CrisisModal } from "./CrisisModal";

export function CrisisFooter() {
  const lang = useStore((s) => s.language);
  const [open, setOpen] = useState(false);

  return (
    <footer className="sticky bottom-0 border-t border-ink-800 bg-ink-950/95 backdrop-blur px-5 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <p className="text-xs text-ink-300">{t(lang, "crisisFooter")}</p>
        <button
          className="btn-alert text-xs px-3 py-2"
          onClick={() => setOpen(true)}
          aria-label={t(lang, "crisisCta")}
        >
          {t(lang, "crisisCta")}
        </button>
      </div>

      <CrisisModal open={open} onClose={() => setOpen(false)} />
    </footer>
  );
}
