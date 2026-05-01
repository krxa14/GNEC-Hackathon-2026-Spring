# Privacy notes

ShadowFile is designed so that sensitive reflections do not need to leave your device. This document explains what is stored, where it lives, and the limits of the hosted preview.

## Where data lives

All journal entries, walkthrough state, and screener results are stored **on the local browser** that you use ShadowFile from. Specifically:

- **IndexedDB** holds journal content via `idb-keyval`.
- **localStorage** holds lightweight UI state and flags (for example, language preference, last-used flow).
- **Memory only** holds the symmetric encryption key derived from your passphrase.

There is no server-side database of user content. There is no account.

## Encryption at rest

When you set a passphrase, ShadowFile derives a symmetric key with **Argon2id** (via `libsodium`). That key:

- never leaves your device
- never persists to disk
- only lives in JavaScript memory while the tab is open

When the tab is closed, the key is gone. To read your encrypted journal again, you re-enter the passphrase. There is no recovery path if the passphrase is lost — that is intentional.

## Local AI mode (Ollama)

The default and recommended mode runs the model locally with [Ollama](https://ollama.com).

- The active turn plus a short rolling window of recent turns are sent to `http://localhost:11434` on your own machine.
- Nothing is transmitted to a third-party AI provider.
- No API key is required.
- No request is logged remotely.

## Hosted preview limitation

`https://shadowfile-nu.vercel.app` is a **preview** of the interface. If a cloud AI route is configured for the preview, requests to that route flow through a Vercel Edge proxy designed not to log request bodies. Even so:

- The preview is convenience for judges and demos, not a privacy guarantee.
- For real reflective use, **run ShadowFile locally** so the AI stays on your device.
- Network operators between your browser and any hosted endpoint can see that a request was made, even if the body is not logged.

## What ShadowFile does not do

- Does not create accounts.
- Does not collect analytics on your reflections.
- Does not upload journal content to a backend.
- Does not share data with employers, NGOs, or any third party.
- Does not act as a workplace monitoring tool.

## Resetting local data

To wipe everything ShadowFile has stored on your current browser:

1. Open ShadowFile in your browser.
2. Open DevTools → **Application** → **Storage**.
3. Click **Clear site data** with all checkboxes enabled.
4. (Optional) Uninstall the installed PWA from your OS application list.

Or, scoped reset paths from inside the app:

- **Sign out** clears the in-memory key, requiring the passphrase again to read encrypted entries.
- **Reset journal** (in settings) deletes IndexedDB content for ShadowFile while leaving the app installed.

After clearing site data, journal content is unrecoverable. This is by design.

## Crisis routing and safety

The Columbia C-SSRS routing logic and crisis-line surfaces are intentionally always-on, regardless of privacy settings. ShadowFile is a peer companion, not a clinician — it does not replace crisis lines, emergency services, or clinical care.
