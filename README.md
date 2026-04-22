# DoseGuard

DoseGuard turns antibiotic instructions into a one-page checklist the patient marks dose by dose until the course is finished.

## What this build includes hi hi 

- A static browser-based checklist generator with a preloaded oral antibiotic list
- Print-first card output with large check boxes, black borders, and no color dependency
- Hard-coded language toggles for English, Spanish, and Hindi labels
- An About page that preserves the locked cause-and-evidence framing
- Distinct citation handling so WHO supports the AMR framing and peer-reviewed sources support the product-evidence bridge

## Product scope

DoseGuard is intentionally narrow. It does not claim to solve antimicrobial resistance. It addresses one practical misuse pathway at the dispensing counter by improving instruction clarity and giving the patient an active checkoff card to mark after each dose.

## Local preview

Because this is a static site, any simple web server will work. For example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Files

- `/index.html` contains the main generator
- `/about.html` contains the locked framing and citation links
- `/script.js` renders the active checkoff card
- `/styles.css` handles the app and print layout
- `/docs/citations.md` stores citation discipline and source notes

## Deployment

This repository is ready for static hosting on Vercel. `vercel.json` keeps routing simple for a static deploy.

## Citation discipline

Keep these claims separate everywhere:

- WHO fact sheet on antimicrobial resistance: cause framing only
- Peer-reviewed evidence on prescription label misunderstanding: product-evidence bridge
- Peer-reviewed evidence on pictograms improving comprehension: design choice support
