# Demo recording guide

A short, repeatable script for recording the ShadowFile demo video. Aim for **2–3 minutes**.

## Local run for the demo

Run ShadowFile locally so the AI mode is fully active and nothing depends on the hosted preview.

```bash
git clone https://github.com/krxa14/GNEC-Hackathon-2026-Spring.git
cd GNEC-Hackathon-2026-Spring
bash start.sh
```

The script installs dependencies, pulls the local Ollama model, and opens the app in your browser.

If you want a stronger model for nuanced reflection during the demo:

```bash
bash start.sh --strong
```

Wait until the first AI reply streams in before starting the recording — this confirms the model is warm.

## Demo script

1. **Open Home.** Read the one-line framing: a private companion for the people who carry what they see.
2. **Offshift check-in.** Type a short, realistic prompt (for example: *"long shift, two losses, can't shut my brain off"*). Show the somber, non-cheerful tone of the reply.
3. **Moral Injury walkthrough.** Step into the guided 5-step Shay/Litz flow. Walk through one step to show the structure.
4. **ProQOL-5.** Open the screener. Show one or two questions and the result framing (compassion satisfaction / burnout / STS).
5. **Sleep support.** Show the nightly check entry and grounding prompt.
6. **Shadow Logbook.** Show that the prior moral-injury walkthrough was saved locally.
7. **Privacy.** Open the privacy section. Call out: local encrypted storage, local Ollama, no account, no cloud upload.
8. **Crisis footer.** Point at the always-visible crisis line access.

Close with a single sentence on SDG 3.4 framing.

## Recording checklist

- [ ] Local run is up and the AI has produced its first response
- [ ] Browser zoom set so text is readable in the recording
- [ ] System notifications, Slack, email, calendar popups silenced
- [ ] Clean browser profile (no personal bookmarks, no autofill)
- [ ] Mic checked, room quiet, no fan noise
- [ ] Screen resolution set to 1080p or higher
- [ ] Cursor highlighting on (so the viewer can follow clicks)
- [ ] Run through the script once before recording
- [ ] Time the take — under 3 minutes
- [ ] Re-record any segment with a typo, long pause, or model stall
- [ ] Export as MP4, watch it back end-to-end before submitting
