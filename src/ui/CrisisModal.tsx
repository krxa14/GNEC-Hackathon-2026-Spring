import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import { t } from "../i18n";
import { useDialogFocusTrap } from "./useDialogFocusTrap";

type CrisisLine = {
  country: string;
  label: string;
  tel: string;
  sms?: string;
  url: string;
};

type CrisisLineResponse = {
  lines: CrisisLine[];
};

type CrisisModalProps = {
  open: boolean;
  urgent?: boolean;
  onClose: () => void;
};

const COUNTRY_STORAGE_KEY = "shadowfile.country";
const DEFAULT_COUNTRY = "US";
const TRUSTED_CONTACT_MESSAGE =
  "Please stay with me right now. I need support and I do not want to handle this alone.";

function inferCountry(): string {
  if (typeof window === "undefined") return DEFAULT_COUNTRY;
  const locales = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  for (const locale of locales) {
    const match = locale.match(/[-_](?<country>[A-Za-z]{2})$/);
    const country = match?.groups?.country?.toUpperCase();
    if (country) return country;
  }
  return DEFAULT_COUNTRY;
}

function buildSmsHref(number?: string, body?: string): string {
  const encoded = body ? encodeURIComponent(body) : "";
  if (number && body) return `sms:${number}?&body=${encoded}`;
  if (number) return `sms:${number}`;
  return `sms:?&body=${encoded}`;
}

export function CrisisModal({ open, urgent = false, onClose }: CrisisModalProps) {
  const lang = useStore((s) => s.language);
  const [lines, setLines] = useState<CrisisLine[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const stored =
      typeof window === "undefined" ? null : window.localStorage.getItem(COUNTRY_STORAGE_KEY);
    setSelectedCountry((stored ?? inferCountry()).toUpperCase());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoading(true);

    void fetch("/crisis-lines.json", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load crisis lines: ${res.status}`);
        return (await res.json()) as CrisisLineResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setLines(Array.isArray(data.lines) ? data.lines : []);
      })
      .catch(() => {
        if (!cancelled) setLines([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useDialogFocusTrap({ open, containerRef, onClose, disableEscape: urgent });

  const orderedLines = useMemo(
    () => [...lines].sort((a, b) => a.country.localeCompare(b.country)),
    [lines]
  );

  const selectedLine =
    orderedLines.find((line) => line.country === selectedCountry) ??
    orderedLines.find((line) => line.country === inferCountry()) ??
    orderedLines.find((line) => line.country === DEFAULT_COUNTRY) ??
    orderedLines[0] ??
    null;

  if (!open) return null;

  async function shareWithTrustedContact() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "ShadowFile",
          text: TRUSTED_CONTACT_MESSAGE
        });
        return;
      } catch {
        // Fall back to SMS when native sharing is unavailable or cancelled.
      }
    }

    window.location.href = buildSmsHref(undefined, TRUSTED_CONTACT_MESSAGE);
  }

  function onCountryChange(country: string) {
    setSelectedCountry(country);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COUNTRY_STORAGE_KEY, country);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-ink-950/95 px-5 py-6"
    >
      <div className="mx-auto flex min-h-full max-w-2xl items-center">
        <div className="panel w-full space-y-5">
          <div ref={containerRef} tabIndex={-1} className="outline-none">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-alert">
              {urgent ? t(lang, "crisisModalUrgentEyebrow") : t(lang, "crisisModalEyebrow")}
            </p>
            <h2 id="crisis-modal-title" className="text-2xl leading-tight">
              {urgent ? t(lang, "crisisModalUrgentTitle") : t(lang, "crisisModalTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-ink-300">
              {urgent ? t(lang, "crisisModalUrgentBody") : t(lang, "crisisModalBody")}
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-300">
              {t(lang, "crisisModalCountry")}
            </span>
            <select
              className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-sm text-ink-100 outline-none"
              value={selectedLine?.country ?? selectedCountry}
              onChange={(event) => onCountryChange(event.target.value)}
            >
              {orderedLines.map((line) => (
                <option key={line.country} value={line.country}>
                  {line.country} — {line.label}
                </option>
              ))}
            </select>
          </label>

          {isLoading ? (
            <p className="text-sm text-ink-300">{t(lang, "crisisModalLoading")}</p>
          ) : selectedLine ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-ink-700 bg-ink-950 px-4 py-4">
                <div className="text-sm font-medium">{selectedLine.label}</div>
                <div className="mt-2 text-sm text-ink-300">{selectedLine.country}</div>
                <a
                  href={selectedLine.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm text-accent-soft underline underline-offset-4"
                >
                  {t(lang, "crisisModalWebsite")}
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <a href={`tel:${selectedLine.tel}`} className="btn-alert">
                  {t(lang, "crisisModalCall")}
                </a>
                {selectedLine.sms ? (
                  <a href={buildSmsHref(selectedLine.sms)} className="btn-ghost">
                    {t(lang, "crisisModalText")}
                  </a>
                ) : (
                  <a href={selectedLine.url} target="_blank" rel="noreferrer" className="btn-ghost">
                    {t(lang, "crisisModalNoText")}
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-300">{t(lang, "crisisModalUnavailable")}</p>
          )}

          <div className="rounded-2xl border border-ink-700 bg-ink-950 px-4 py-4">
            <div className="text-sm font-medium">{t(lang, "crisisModalShareTitle")}</div>
            <p className="mt-2 text-sm leading-relaxed text-ink-300">
              {t(lang, "crisisModalShareBody")}
            </p>
            <button className="btn-ghost mt-4" onClick={() => void shareWithTrustedContact()}>
              {t(lang, "crisisModalShare")}
            </button>
          </div>

          <div className="flex justify-end">
            <button className="btn-ghost" onClick={onClose}>
              {t(lang, "crisisModalClose")}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
