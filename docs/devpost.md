## Problem
Humanitarian and frontline aid workers absorb repeated trauma, grief, helplessness, and moral conflict while working in conditions where support is often hard to access, hard to trust, or professionally unsafe to seek. Most mental-health products are not built for that reality.

## The ignored workforce
ShadowFile starts from a blunt premise: the SDGs depend on the people carrying them out. If those workers break down, the system loses capacity exactly where the pressure is highest. The product is aimed at aid workers, UN field staff, NGO teams, CHWs, crisis counsellors, and conflict-zone journalists who need something private, local-first, and emotionally literate.

## What ShadowFile does
ShadowFile is a private companion for offshift check-ins.

- Local encrypted journal with a passphrase-derived key kept only in memory
- AI check-in with a somber, non-cheerful tone designed for humanitarian contexts
- Suicide-risk recognition with in-app C-SSRS routing and country crisis contacts
- Guided moral-injury walkthrough for betrayal, perpetration, and witnessing
- Sleep check and monthly ProQOL screen for burnout / STS patterns
- PWA installability and offline-aware behavior

## Screenshots (3)
1. Home screen with offshift check-in and guided flow entry points
2. Chat flow showing reflective response and safety routing
3. Moral injury or ProQOL flow showing structured step-by-step support

## Architecture (privacy diagram — text description)
The browser app stores journal content locally in IndexedDB. If the user enables encryption, a passphrase is converted into a symmetric key with Argon2id and that key remains in memory only while the session is open. The browser sends only the active turn plus a short rolling window of recent turns to a Vercel Edge proxy. The proxy forwards that request to Claude and streams the text response back. The proxy is designed not to log request bodies or persist user content.

## Evidence (3 citations inline)
Connorton et al. (2012) supports the claim that humanitarian workers face disproportionate trauma-related mental-health burden. WHO Psychological First Aid (2011) shapes the app’s tone and grounding style. Posner et al. (2011) and the public-use Columbia C-SSRS support the suicide-risk screen and routing logic.

## Scope honesty
ShadowFile is a companion, not a clinician. It does not diagnose, replace therapy, or stand in for crisis services. It uses evidence to shape tone, routing, and screen structure, but does not claim endorsement from WHO, Columbia, or ProQOL.org.

## SDG mapping: 3.4, 3.D, 8.8
- SDG 3.4: support earlier response to distress, burnout, and suicide risk
- SDG 3.D: strengthen local readiness and resilience around mental-health strain in crisis settings
- SDG 8.8: protect the wellbeing of workers operating in high-risk humanitarian environments

## Roadmap: AR + RU languages, supervisor-safe team pilot, NGO API integration
- Arabic and Russian language support
- Supervisor-safe team pilot with humanitarian partner networks
- NGO API integrations for region-specific referral routing and resource updates
