# ShadowFile

Privacy-first AI decompression for healthcare workers, responders, and caregivers.

## One-command local run

### Mac / Linux

```bash
git clone https://github.com/krxa14/GNEC-Hackathon-2026-Spring.git
cd GNEC-Hackathon-2026-Spring
bash start.sh
```

### Windows

```
git clone https://github.com/krxa14/GNEC-Hackathon-2026-Spring.git
cd GNEC-Hackathon-2026-Spring
```
Then double-click `start.bat`.

The script will:
- Check Node.js (guides you to install if missing)
- Check Ollama (opens download page if missing)
- Pull the local AI model (once, cached after)
- Install npm dependencies
- Start ShadowFile and open your browser

**No API key required. No hosted AI account required. No token limits.**

### Optional: stronger AI model

```bash
bash start.sh --strong
```

| | Default | `--strong` |
|--|--|--|
| Model | llama3.2:3b | llama3.1:8b |
| Download | ~2 GB | ~5 GB |
| Setup speed | Fast | Slower first run |
| Response quality | Good | Better |

For hackathon judging, default is fine. `--strong` gives noticeably better responses for nuanced mental-health reflection.

Prerequisites (install once):
- [Node.js LTS](https://nodejs.org)
- [Ollama](https://ollama.com) — the script opens the download page automatically if missing

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

**Priority order:** Ollama local → OpenRouter cloud → show setup message

### Primary: Local Ollama

Model runs on your machine. No cloud, no API key, no limits.
`bash start.sh` handles everything.

### Optional: Cloud fallback (OpenRouter)

Only used if Ollama is not configured. Sign up free at [openrouter.ai](https://openrouter.ai) → create key (no credit card) → add to `.env.local`:

```
OPENROUTER_API_KEY=sk-or-...
```

### Hosted demo

`https://shadowfile-nu.vercel.app` — demonstrates the interface and all flows. If cloud AI is unavailable, the site shows instructions to run locally. **The full AI-enabled version runs locally.**

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
