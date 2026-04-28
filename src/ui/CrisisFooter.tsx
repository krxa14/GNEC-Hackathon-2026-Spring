import { useState } from "react";
import { useStore } from "../store";
import { t } from "../i18n";
import { CrisisModal } from "./CrisisModal";

export function CrisisFooter({ inline = false }: { inline?: boolean }) {
  const lang = useStore((s) => s.language);
  const [open, setOpen] = useState(false);

  if (inline) {
    // Sidebar / overlay nav version — minimal uppercase nav item in alert color
    return (
      <>
        <button
          className="text-left text-[11px] tracking-[0.17em] uppercase text-alert hover:text-alert/70 transition-colors duration-150"
          onClick={() => setOpen(true)}
          aria-label={t(lang, "crisisCta")}
        >
          CRISIS LINE
        </button>
        <CrisisModal open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  // Mobile sticky footer version (hidden on md+)
  return (
    <>
      <footer className="md:hidden sticky bottom-0 border-t border-ink-800 bg-ink-950/95 backdrop-blur px-5 py-3 z-10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-300">{t(lang, "crisisFooter")}</p>
          <button
            className="btn-alert text-xs px-3 py-2"
            onClick={() => setOpen(true)}
            aria-label={t(lang, "crisisCta")}
          >
            {t(lang, "crisisCta")}
          </button>
        </div>
      </footer>
      <CrisisModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
