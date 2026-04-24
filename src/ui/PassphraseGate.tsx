import { FormEvent, useEffect, useState } from "react";
import { loadSession } from "../storage/journal";
import { useStore } from "../store";
import { t } from "../i18n";

const MODE_KEY = "shadowfile.journal.mode";
const SALT_KEY = "shadowfile.journal.salt";
const SESSION_KEY = "shadowfile.session.current";

function getCurrentSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}`;
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

function zeroKey(): Uint8Array {
  return new Uint8Array(32);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function PassphraseGate() {
  const lang = useStore((s) => s.language);
  const setSessionKey = useStore((s) => s.setSessionKey);
  const setSessionId = useStore((s) => s.setSessionId);
  const replaceTurns = useStore((s) => s.replaceTurns);
  const sessionKey = useStore((s) => s.sessionKey);
  const [mode, setMode] = useState<"create" | "unlock" | "unencrypted">("create");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionKey) return;
    const storedMode = window.localStorage.getItem(MODE_KEY);
    const storedSalt = window.localStorage.getItem(SALT_KEY);

    if (storedMode === "none") {
      setMode("unencrypted");
    } else if (storedMode === "passphrase" && storedSalt) {
      setMode("unlock");
    } else {
      setMode("create");
    }
    setIsLoading(false);
  }, [sessionKey]);

  if (sessionKey) return null;
  if (isLoading) {
    return (
      <div className="panel mx-auto mt-12 max-w-lg">
        <p className="text-sm text-ink-300">{t(lang, "passphraseLoading")}</p>
      </div>
    );
  }

  async function unlockWithKey(key: Uint8Array) {
    const sessionId = getCurrentSessionId();
    const turns = await loadSession(sessionId, key);
    setSessionId(sessionId);
    replaceTurns(turns);
    setSessionKey(key);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        if (passphrase.trim().length < 8) {
          throw new Error(t(lang, "passphraseErrorShort"));
        }
        const { deriveKey, newSalt } = await import("../crypto/kdf");
        const salt = newSalt();
        const key = await deriveKey(passphrase, salt);
        window.localStorage.setItem(MODE_KEY, "passphrase");
        window.localStorage.setItem(SALT_KEY, toBase64(salt));
        await unlockWithKey(key);
      } else if (mode === "unlock") {
        const saltValue = window.localStorage.getItem(SALT_KEY);
        if (!saltValue) {
          throw new Error(t(lang, "passphraseErrorMissing"));
        }
        const { deriveKey } = await import("../crypto/kdf");
        const key = await deriveKey(passphrase, fromBase64(saltValue));
        await unlockWithKey(key);
      } else {
        window.localStorage.setItem(MODE_KEY, "none");
        window.localStorage.removeItem(SALT_KEY);
        await unlockWithKey(zeroKey());
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t(lang, "passphraseErrorGeneric");
      setError(message === "wrong secret key for the given ciphertext" ? t(lang, "passphraseErrorWrong") : message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-lg space-y-6">
      <section className="panel space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-accent-soft">
            {mode === "create" ? t(lang, "passphraseCreateEyebrow") : t(lang, "passphraseUnlockEyebrow")}
          </p>
          <h1 className="text-2xl leading-tight">
            {mode === "create" ? t(lang, "passphraseCreateTitle") : mode === "unlock" ? t(lang, "passphraseUnlockTitle") : t(lang, "passphraseUnencryptedTitle")}
          </h1>
          <p className="text-sm leading-relaxed text-ink-300">
            {mode === "create" ? t(lang, "passphraseCreateBody") : mode === "unlock" ? t(lang, "passphraseUnlockBody") : t(lang, "passphraseUnencryptedBody")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          {mode !== "unencrypted" ? (
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-300">
                {t(lang, "passphraseLabel")}
              </span>
              <input
                type="password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                placeholder={t(lang, "passphrasePlaceholder")}
                className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-sm text-ink-100 outline-none"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-alert">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" type="submit" disabled={isSubmitting}>
              {mode === "create"
                ? t(lang, "passphraseCreateSubmit")
                : mode === "unlock"
                ? t(lang, "passphraseUnlockSubmit")
                : t(lang, "passphraseUnencryptedSubmit")}
            </button>
            {mode === "create" ? (
              <button
                className="btn-ghost"
                type="button"
                onClick={() => {
                  setMode("unencrypted");
                  setError("");
                }}
              >
                {t(lang, "passphraseSkip")}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
