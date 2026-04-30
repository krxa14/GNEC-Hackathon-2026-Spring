# ShadowFile

A companion for the people who carry what they see.

## Quick Start

ShadowFile runs locally with Ollama by default.

```bash
git clone https://github.com/krxa14/GNEC-Hackathon-2026-Spring.git
cd GNEC-Hackathon-2026-Spring
bash start.sh
```

Windows: double-click `start.bat` after cloning.

The script installs dependencies, pulls the local model, starts the app, and opens the browser automatically.

**No API key required. No hosted AI account required. No token limits.**

Prerequisites (install once):
- [Node.js LTS](https://nodejs.org)
- [Ollama](https://ollama.com) — for local AI (no API key, no rate limits, works offline)

---

## What it is

ShadowFile is a privacy-first emotional decompression tool for humanitarian aid workers, UN field staff, NGO frontline teams, community health workers, crisis counsellors, and conflict-zone journalists.

Unlike a hosted AI chatbot, ShadowFile is designed to run locally with Ollama. Sensitive reflections do not need to be sent to a cloud AI provider. The app works without API keys, token limits, or rate-limit failures.

ShadowFile is a peer companion, not a clinician. It will never replace professional care.

## Why this exists

Humanitarian and UN field staff have PTSD and secondary-traumatic-stress rates 2–3× the general population, and near-zero access to trauma-informed care at the pace and privacy their work requires. Consumer mental-health apps target patients, not the workforce. ShadowFile targets the workforce.

This maps directly to **SDG 3.4** (mental health and well-being). If the people delivering the SDGs break, the goals do not land.

## Features

- **Offshift check-in** — short reflective chat after a shift
- **Moral injury walkthrough** — 5-step guided Shay/Litz framework
- **ProQOL-5 screener** — compassion satisfaction / burnout / secondary traumatic stress
- **Columbia C-SSRS safety routing** — crisis detection and crisis-line routing
- **Sleep support** — nightly check with grounding
- **Multilingual** — English, French, Spanish
- **Encrypted local storage** — journal entries stay on device, encrypted with libsodium
- **Growing garden** — visual reward that grows with each reflection
- **Crisis footer** — always-visible crisis line access

## AI modes

### Primary: Local Ollama (recommended)

Runs the model on your machine. No cloud, no API key, no limits.

```bash
bash start.sh   # handles everything automatically
```

Or Docker (no Node.js needed):

```bash
docker compose up
```

### Optional: Hosted AI via OpenRouter

For cloud fallback only. Sign up free at [openrouter.ai](https://openrouter.ai) → create a key → add to `.env.local`:

```
OPENROUTER_API_KEY=sk-or-...
```

The hosted web demo at `https://shadowfile-nu.vercel.app` uses this mode. The full AI-enabled version runs locally.

## Architecture (privacy-first)

- **Frontend:** Vite + React + TypeScript + Tailwind, PWA
- **Storage:** IndexedDB via `idb-keyval`, encrypted at rest with `libsodium` (Argon2id KDF)
- **AI (local):** Ollama, OpenAI-compatible, runs on device — no data leaves the machine
- **AI (cloud, optional):** OpenRouter Edge Function proxy, zero-log: request bodies never persisted
- **Safety:** client-side pre-filter + structured `<RISK>` trailer on every AI reply drives C-SSRS routing
- **Offline:** service worker pre-caches shell + all screener flowcharts

## Evidence base

- WHO Psychological First Aid
- WHO mhGAP Humanitarian Intervention Guide
- Columbia C-SSRS (Posner et al.)
- ProQOL-5 (Stamm)
- Shay / Litz moral-injury framework
- ACT / cognitive defusion (Hayes, Strosahl)

See [`docs/citations.md`](./docs/citations.md).

## Scope honesty

- ShadowFile is a peer reflective companion. It is not a clinician.
- It is not a diagnostic tool.
- It is not a workplace monitoring tool. Employers cannot see anything.
- It does not replace crisis lines, emergency services, or clinical care.

## SDG mapping

- **SDG 3.4** — mental health and well-being
- **SDG 3.D** — emergency preparedness of the workforce delivering emergency response
- **SDG 8.8** — safe working environments for all workers

## License

MIT
