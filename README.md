# ShadowFile

A companion for the people who carry what they see.

ShadowFile is a private, low-affect, evidence-based journaling + voice companion for humanitarian aid workers, UN field staff, NGO frontline teams, community health workers, crisis counsellors, and conflict-zone journalists. Short check-ins, moral-injury framing, validated screeners (C-SSRS, ProQOL-5), crisis-line routing when it matters.

ShadowFile is a peer companion, not a clinician. It will never replace professional care.

## Why this exists

Humanitarian and UN field staff have PTSD and secondary-traumatic-stress rates 2–3× the general population, and near-zero access to trauma-informed care at the pace and privacy their work requires. Consumer mental-health apps target patients, not the workforce. ShadowFile targets the workforce.

This maps directly to **SDG 3.4** (mental health and well-being). Reframed for this audience: if the people delivering the SDGs break, the goals do not land.

## Design principles

1. Peer companion, never clinician.
2. Local-first. Journal entries live only on the device, encrypted at rest.
3. No account, no ads, no streaks, no push, no gamification.
4. Safety nets are wired in, never cosmetic: C-SSRS, crisis-line routing, always-visible crisis button.
5. 2 minutes or less by default.
6. Three UN working languages at launch: English, French, Spanish.
7. 18+. Clinical content.

## Architecture (privacy-first)

- **Frontend:** Vite + React + TypeScript + Tailwind, deployed as a PWA.
- **Storage:** IndexedDB via `idb-keyval`. Journal entries are encrypted at rest with `libsodium` using a key derived from a user passphrase (Argon2id).
- **AI:** OpenRouter via a Vercel Edge Function proxy (`/api/chat`). The proxy is **zero-log**: request bodies are never written to logs or storage. The OpenRouter API key never reaches the browser.
- **Routing:** OpenRouter free-tier models are tried in order until one accepts. The system prompt and client-side safety routing stay local to ShadowFile.
- **Safety:** a client-side pre-filter short-circuits acute risk language to the C-SSRS flow before any network call; the model also emits a structured `<RISK>` trailer on every reply that drives post-response routing.
- **Offline:** service worker pre-caches the shell and all screener flowcharts. Screeners + journaling still work without network.

## Running locally

### Quickest path — one script

**Mac / Linux:**
```bash
git clone https://github.com/krxa14/GNEC-Hackathon-2026-Spring.git
cd GNEC-Hackathon-2026-Spring
bash start.sh
```

**Windows:**
```
git clone https://github.com/krxa14/GNEC-Hackathon-2026-Spring.git
cd GNEC-Hackathon-2026-Spring
start.bat   ← double-click this
```

The script checks for Node.js, installs dependencies, configures Ollama (if installed), and opens the app. First run takes a few minutes if Ollama needs to pull a model (~2 GB).

**Prerequisites (install once):**
- [Node.js LTS](https://nodejs.org) — required
- [Ollama](https://ollama.com) — optional, for fully offline AI (no API key needed)

### Alternative — Docker (one command, everything included)

```bash
git clone https://github.com/krxa14/GNEC-Hackathon-2026-Spring.git
cd GNEC-Hackathon-2026-Spring
docker compose up
```

Pulls Ollama + model automatically. Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### Alternative — Cloud API (OpenRouter, free account)

If you don't want Ollama, sign up free at [openrouter.ai](https://openrouter.ai) → Keys → Create key (no credit card). Then:

```bash
cp .env.example .env.local
# edit .env.local: set OPENROUTER_API_KEY=sk-or-...
npm install && npm run dev
```

## Evidence

See [`docs/citations.md`](./docs/citations.md). Every framework has a narrow authorised use. Citations never collapse.

## Scope honesty

- ShadowFile is a peer reflective companion. It is not a clinician.
- It is not a diagnostic tool.
- It is not a workplace monitoring tool. Employers cannot see anything.
- It does not replace crisis lines, emergency services, or clinical care.

## SDG mapping

- **SDG 3.4** — reduce premature mortality from non-communicable diseases and promote mental health and well-being.
- **SDG 3.D** — emergency preparedness of the workforce that delivers emergency response.
- **SDG 8.8** — protect labour rights and promote safe working environments for all workers, including those in precarious employment.

## License

See `LICENSE` (to be added).
