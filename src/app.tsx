import { useState } from "react";
import { Chat } from "./ui/Chat";
import { CrisisFooter } from "./ui/CrisisFooter";
import { PassphraseGate } from "./ui/PassphraseGate";
import { MoralInjury } from "./flows/MoralInjury";
import { Sleep } from "./flows/Sleep";
import { ProQOLFlow } from "./screeners/ProQOLFlow";
import { Evidence } from "./evidence";
import { Privacy } from "./privacy";
import { useStore } from "./store";
import { t } from "./i18n";

type View = "home" | "chat" | "evidence" | "privacy" | "moralInjury";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [sleepOpen, setSleepOpen] = useState(false);
  const [proqolOpen, setProqolOpen] = useState(false);
  const lang = useStore((s) => s.language);
  const sessionKey = useStore((s) => s.sessionKey);

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
        {sessionKey ? (
          <>
            {view === "home" && (
              <Home
                onStart={() => setView("chat")}
                onStartMoralInjury={() => setView("moralInjury")}
                onOpenSleep={() => setSleepOpen(true)}
                onOpenProQOL={() => setProqolOpen(true)}
              />
            )}
            {view === "chat" && (
              <Chat
                onOpenMoralInjury={() => setView("moralInjury")}
                onOpenSleep={() => setSleepOpen(true)}
              />
            )}
            {view === "evidence" && <Evidence />}
            {view === "privacy" && <Privacy />}
            {view === "moralInjury" && (
              <MoralInjury
                onBack={() => setView("home")}
                onRouteToCheckIn={() => setView("chat")}
              />
            )}
          </>
        ) : (
          <PassphraseGate />
        )}
      </main>

      {sessionKey ? (
        <Sleep
          open={sleepOpen}
          onClose={() => setSleepOpen(false)}
          onRouteToCheckIn={() => {
            setSleepOpen(false);
            setView("chat");
          }}
        />
      ) : null}
      {sessionKey ? (
        <ProQOLFlow
          open={proqolOpen}
          onClose={() => setProqolOpen(false)}
          onRouteToCheckIn={() => {
            setProqolOpen(false);
            setView("chat");
          }}
          onCompleted={() => undefined}
        />
      ) : null}

      {sessionKey ? <CrisisFooter /> : null}
    </div>
  );
}

function Home({
  onStart,
  onStartMoralInjury,
  onOpenSleep,
  onOpenProQOL
}: {
  onStart: () => void;
  onStartMoralInjury: () => void;
  onOpenSleep: () => void;
  onOpenProQOL: () => void;
}) {
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

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel space-y-4">
          <h2 className="text-lg">{t(lang, "moralEntry")}</h2>
          <p className="text-sm text-ink-300">{t(lang, "moralEntryBody")}</p>
          <button className="btn-ghost" onClick={onStartMoralInjury}>
            {t(lang, "moralEntryButton")}
          </button>
        </div>

        <div className="panel space-y-4">
          <h2 className="text-lg">{t(lang, "sleepEntry")}</h2>
          <p className="text-sm text-ink-300">{t(lang, "sleepEntryBody")}</p>
          <button className="btn-ghost" onClick={onOpenSleep}>
            {t(lang, "sleepEntryButton")}
          </button>
        </div>
      </section>

      <section className="panel space-y-4">
        <h2 className="text-lg">{t(lang, "proqolEntry")}</h2>
        <p className="text-sm text-ink-300">{t(lang, "proqolEntryBody")}</p>
        <button className="btn-ghost" onClick={onOpenProQOL}>
          {t(lang, "proqolEntryButton")}
        </button>
      </section>

      <section className="text-xs text-ink-300 leading-relaxed">
        {t(lang, "notClinician")}
      </section>
    </div>
  );
}
