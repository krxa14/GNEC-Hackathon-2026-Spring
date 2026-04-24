export function Privacy() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-soft">Privacy</p>
        <h1 className="text-3xl leading-tight">Threat model, plainly stated.</h1>
        <p className="text-sm leading-relaxed text-ink-300">
          This page is meant to be read as an honest boundary, not marketing copy.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl">What stays on this device</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          Your journal turns are saved locally in IndexedDB. If you choose a passphrase, the journal payload is encrypted at rest before it is written. Sleep ratings and ProQOL history also stay on this device. The passphrase itself is never stored. Only the derived key exists in memory while the app is open.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">What goes to the AI proxy</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          Only the current turn and a short rolling window of recent turns are sent to the AI proxy for response generation. The full encrypted journal is not sent automatically. Your passphrase is never sent. Local sleep and ProQOL data are not sent as content; only the last ProQOL completion timestamp may be sent so the app can avoid over-recommending that screen.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">What the proxy does not do</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          The proxy is intended to avoid request-body logging, persistent storage, cookies, analytics, and identity features. Its job is narrow: receive a short request, forward it to the model, and stream the response back.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">If you lose your passphrase</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          The encrypted journal is not recoverable by design. There is no recovery email, no account fallback, and no server-side copy of the key.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">What this does not protect against</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          If someone has access to your unlocked device, they may be able to read what is on screen. If you choose the unencrypted mode, journal content remains readable on this device. If your browser profile is compromised, local storage protections may not help. Privacy here is local-first and narrower than full endpoint security.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Source review</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          The source code for this project is public at{" "}
          <a
            href="https://github.com/krxa14/GNEC-Hackathon-2026-Spring"
            className="underline underline-offset-2 hover:text-ink-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/krxa14/GNEC-Hackathon-2026-Spring
          </a>
          . Judges can inspect the zero-log proxy claim directly in{" "}
          <code>api/chat.ts</code>.
        </p>
      </section>
    </article>
  );
}
