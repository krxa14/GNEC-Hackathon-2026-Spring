import { useState } from "react";
import { Chat } from "./ui/Chat";
import { CrisisFooter } from "./ui/CrisisFooter";
import { useStore } from "./store";
import { t } from "./i18n";

type View = "home" | "chat" | "evidence" | "privacy";

export default function App() {
  const [view, setView] = useState<View>("home");
  const lang = useStore((s) => s.language);

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-ink-800 px-5 py-4 flex items-center justify-between">
        <button
          className="flex items-center gap-3 text-left"
          onClick={() => setView("home")}
        >
          <span className="h-8 w-8 rounded-lg bg-ink-700 grid place-items-center font-serif text-ink-100">
            SF
          </span>
          <span>
            <div className="text-sm font-medium tracking-wide">ShadowFile</div>
            <div className="text-xs text-ink-300">{t(lang, "tagline")}</div>
          </span>
        </button>
        <nav className="flex gap-4 text-sm text-ink-300">
          <button onClick={() => setView("evidence")} className="hover:text-ink-100">
            {t(lang, "navEvidence")}
          </button>
          <button onClick={() => setView("privacy")} className="hover:text-ink-100">
            {t(lang, "navPrivacy")}
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-8">
        {view === "home" && <Home onStart={() => setView("chat")} />}
        {view === "chat" && <Chat />}
        {view === "evidence" && <Evidence />}
        {view === "privacy" && <Privacy />}
      </main>

      <CrisisFooter />
    </div>
  );
}

function Home({ onStart }: { onStart: () => void }) {
  const lang = useStore((s) => s.language);
  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-accent-soft mb-3">
          {t(lang, "eyebrow")}
        </p>
        <h1 className="text-3xl md:text-4xl leading-tight">{t(lang, "heroTitle")}</h1>
        <p className="text-ink-300 mt-4 leading-relaxed">{t(lang, "heroBody")}</p>
      </section>

      <section className="panel space-y-4">
        <h2 className="text-lg">{t(lang, "offshiftTitle")}</h2>
        <p className="text-sm text-ink-300">{t(lang, "offshiftBody")}</p>
        <button className="btn-primary" onClick={onStart}>
          {t(lang, "offshiftCta")}
        </button>
      </section>

      <section className="text-xs text-ink-300 leading-relaxed">
        {t(lang, "notClinician")}
      </section>
    </div>
  );
}

function Evidence() {
  const lang = useStore((s) => s.language);
  return (
    <article className="prose prose-invert max-w-none space-y-4">
      <h1 className="text-2xl font-serif">{t(lang, "navEvidence")}</h1>
      <p className="text-ink-300">Placeholder. Day 8 will fill each citation mapped to the specific feature it supports.</p>
    </article>
  );
}

function Privacy() {
  const lang = useStore((s) => s.language);
  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-serif">{t(lang, "navPrivacy")}</h1>
      <p className="text-ink-300">
        Placeholder. Day 8 will document the threat model in plain language: local-first encrypted journal,
        zero-log AI proxy, no account, no analytics.
      </p>
    </article>
  );
}
