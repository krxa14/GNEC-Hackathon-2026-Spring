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
import type { Language } from "./i18n";
import { Garden } from "./ui/Garden";

function GardenWidget() {
  const entryCount = useStore((s) => s.entryCount);
  const streakDays = useStore((s) => s.streakDays);
  if (entryCount === 0) return null;
  return <Garden entryCount={entryCount} streakDays={streakDays} />;
}

type View = "home" | "chat" | "evidence" | "privacy" | "moralInjury";

const LANG_CYCLE: Language[] = ["en", "fr", "es"];

export default function App() {
  const [view, setView] = useState<View>("home");
  const [sleepOpen, setSleepOpen] = useState(false);
  const [proqolOpen, setProqolOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const lang = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const sessionKey = useStore((s) => s.sessionKey);

  function navigate(v: View) {
    setView(v);
    setMobileNavOpen(false);
  }

  function cycleLang() {
    const idx = LANG_CYCLE.indexOf(lang);
    setLanguage(LANG_CYCLE[(idx + 1) % LANG_CYCLE.length]);
  }

  const navItems = sessionKey ? (
    <nav className="flex flex-col gap-[18px] mt-10">
      <NavItem label="HOME" active={view === "home"} onClick={() => navigate("home")} />
      <NavItem label="OFFSHIFT CHECK-IN" active={view === "chat"} onClick={() => navigate("chat")} />
      <NavItem label="MORAL INJURY" active={view === "moralInjury"} onClick={() => navigate("moralInjury")} />
      <NavItem label="SLEEP" onClick={() => { setSleepOpen(true); setMobileNavOpen(false); }} />
      <NavItem label="PROQOL SCREEN" onClick={() => { setProqolOpen(true); setMobileNavOpen(false); }} />
      <div className="w-6 border-t border-ink-700 my-1" />
      <NavItem label="EVIDENCE" active={view === "evidence"} onClick={() => navigate("evidence")} />
      <NavItem label="PRIVACY" active={view === "privacy"} onClick={() => navigate("privacy")} />
    </nav>
  ) : null;

  return (
    <div className="flex min-h-screen">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 w-[260px] h-screen flex-col bg-ink-950 border-r border-ink-800 px-8 py-10 z-20">
        <button
          className="flex flex-col text-left gap-[5px]"
          onClick={() => navigate("home")}
        >
          <span className="font-serif text-[22px] text-ink-100 leading-none tracking-tight">SF</span>
          <span className="text-[9px] tracking-[0.28em] uppercase text-ink-300">ShadowFile</span>
        </button>

        {navItems}

        {sessionKey ? (
          <div className="mt-8 border-t border-ink-800 pt-6">
            <GardenWidget />
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-4">
          {sessionKey ? <CrisisFooter inline /> : null}
          <button
            onClick={cycleLang}
            className="text-left text-[9px] tracking-[0.22em] uppercase text-ink-600 hover:text-ink-300 transition-colors"
          >
            {lang.toUpperCase()}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-ink-950 border-b border-ink-800 px-5 py-4 flex items-center justify-between">
        <button onClick={() => navigate("home")} className="flex items-center gap-3">
          <span className="font-serif text-lg text-ink-100 leading-none">SF</span>
          <span className="text-[9px] tracking-[0.25em] uppercase text-ink-300">ShadowFile</span>
        </button>
        <button
          className="text-[10px] tracking-[0.18em] uppercase text-ink-300 hover:text-ink-100 transition-colors"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
        >
          {mobileNavOpen ? "CLOSE" : "MENU"}
        </button>
      </header>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-ink-950 px-8 pt-20 pb-10 flex flex-col overflow-y-auto">
          {navItems}
          {sessionKey ? (
            <div className="mt-8 border-t border-ink-800 pt-6">
              <GardenWidget />
            </div>
          ) : null}
          <div className="mt-auto flex flex-col gap-4 pt-8">
            {sessionKey ? <CrisisFooter inline /> : null}
            <button
              onClick={cycleLang}
              className="text-left text-[9px] tracking-[0.22em] uppercase text-ink-600 hover:text-ink-300 transition-colors"
            >
              {lang.toUpperCase()}
            </button>
          </div>
        </div>
      )}

      {/* ── Right content area ── */}
      <main className="flex-1 md:ml-[260px] bg-ink-900 min-h-screen pt-[60px] md:pt-0">
        {view === "chat" && sessionKey ? (
          <Chat
            onOpenMoralInjury={() => navigate("moralInjury")}
            onOpenSleep={() => setSleepOpen(true)}
          />
        ) : (
          <div className="max-w-2xl mx-auto px-8 py-14">
            {sessionKey ? (
              <>
                {view === "home" && (
                  <Home
                    onStart={() => navigate("chat")}
                    onStartMoralInjury={() => navigate("moralInjury")}
                    onOpenSleep={() => setSleepOpen(true)}
                    onOpenProQOL={() => setProqolOpen(true)}
                  />
                )}
                {view === "evidence" && <Evidence />}
                {view === "privacy" && <Privacy />}
                {view === "moralInjury" && (
                  <MoralInjury
                    onBack={() => navigate("home")}
                    onRouteToCheckIn={() => navigate("chat")}
                  />
                )}
              </>
            ) : (
              <PassphraseGate />
            )}
          </div>
        )}
      </main>

      {/* Mobile sticky crisis footer */}
      {sessionKey ? <CrisisFooter /> : null}

      {/* Flow modals */}
      {sessionKey ? (
        <>
          <Sleep
            open={sleepOpen}
            onClose={() => setSleepOpen(false)}
            onRouteToCheckIn={() => { setSleepOpen(false); navigate("chat"); }}
          />
          <ProQOLFlow
            open={proqolOpen}
            onClose={() => setProqolOpen(false)}
            onRouteToCheckIn={() => { setProqolOpen(false); navigate("chat"); }}
            onCompleted={() => undefined}
          />
        </>
      ) : null}
    </div>
  );
}

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`text-left text-[11px] tracking-[0.17em] uppercase transition-colors duration-150 ${
        active ? "text-ink-100" : "text-ink-300 hover:text-ink-100"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Home({
  onStart,
  onStartMoralInjury,
  onOpenSleep,
  onOpenProQOL,
}: {
  onStart: () => void;
  onStartMoralInjury: () => void;
  onOpenSleep: () => void;
  onOpenProQOL: () => void;
}) {
  const lang = useStore((s) => s.language);
  return (
    <div className="space-y-14">
      <section className="flex flex-col md:flex-row md:items-end gap-8 md:gap-10">
        <div className="flex-1 space-y-4">
          <p className="text-[10px] tracking-[0.28em] uppercase text-accent-soft">
            {t(lang, "eyebrow")}
          </p>
          <h1 className="text-3xl md:text-4xl leading-snug">{t(lang, "heroTitle")}</h1>
          <p className="text-ink-300 leading-relaxed max-w-lg">{t(lang, "heroBody")}</p>
        </div>
        <div className="flex-shrink-0 self-center md:self-end w-36 md:w-44 rounded-2xl overflow-hidden opacity-90">
          <img
            src="/bear.jpeg"
            alt="A bear with a backpack and map — carrying what they see"
            className="w-full block"
            style={{ marginTop: "-20%" }}
            draggable={false}
          />
        </div>
      </section>

      <div className="w-12 border-t border-ink-700" />

      <section className="space-y-3">
        <p className="text-[10px] tracking-[0.22em] uppercase text-ink-300">{t(lang, "offshiftTitle")}</p>
        <p className="text-sm text-ink-300 leading-relaxed max-w-sm">{t(lang, "offshiftBody")}</p>
        <button className="btn-primary mt-1" onClick={onStart}>
          {t(lang, "offshiftCta")}
        </button>
      </section>

      <div className="w-12 border-t border-ink-700" />

      <section className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-ink-300">{t(lang, "moralEntry")}</p>
          <p className="text-sm text-ink-300 leading-relaxed">{t(lang, "moralEntryBody")}</p>
          <button className="btn-ghost" onClick={onStartMoralInjury}>
            {t(lang, "moralEntryButton")}
          </button>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-ink-300">{t(lang, "sleepEntry")}</p>
          <p className="text-sm text-ink-300 leading-relaxed">{t(lang, "sleepEntryBody")}</p>
          <button className="btn-ghost" onClick={onOpenSleep}>
            {t(lang, "sleepEntryButton")}
          </button>
        </div>
      </section>

      <div className="w-12 border-t border-ink-700" />

      <section className="space-y-3">
        <p className="text-[10px] tracking-[0.22em] uppercase text-ink-300">{t(lang, "proqolEntry")}</p>
        <p className="text-sm text-ink-300 leading-relaxed max-w-sm">{t(lang, "proqolEntryBody")}</p>
        <button className="btn-ghost" onClick={onOpenProQOL}>
          {t(lang, "proqolEntryButton")}
        </button>
      </section>

      <p className="text-[11px] text-ink-600 leading-relaxed pt-4">
        {t(lang, "notClinician")}
      </p>
    </div>
  );
}
