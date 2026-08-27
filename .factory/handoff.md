# Rehearsal Sightline — build handoff

## What shipped

A complete static Vite + TypeScript v1 for player-specific MusicXML rehearsal planning:

- Local `.musicxml`, `.xml`, and compressed `.mxl` parsing with clear invalid-file, wrong-format, empty-score, and size-limit errors.
- Score metadata and multi-part selection; part changes protect an existing queue with a specific confirmation.
- A measure-level SVG sightline showing notes/rests, rehearsal marks, current position, and 1–8 measure free look-ahead.
- Tempo/time-signature-aware rehearsal clock, manual scrubber, step controls, and keyboard shortcuts.
- Unlimited free rehearsal ranges with player notes and planned / needs work / passed status; deletion confirmation and undo.
- Printable cue sheet plus JSON backup export/import. These core exports are never paywalled.
- Local persistence, offline service-worker shell, online/offline state, and a remove-from-device control.
- US$12 one-time Studio unlock through the Sociobot billing contract: hosted buy link, return-token capture, daily cached verification, optimistic offline behavior, invalid-license handling, and paste-to-restore. Studio enables 16-measure anticipation and target-tempo cues.
- Responsive 390 px layout, print treatment, reduced-motion behavior, legal routes, and original product imagery.

The “glacial minimal ceramics” system and complete asset prompt/provenance are in `.factory/design.md`. Source artwork is in `assets/src/`; shipped WebP versions are 12.5 KB and 35.9 KB. The generated still life was visually reviewed: no text, logo, watermark, recognizable copyrighted notation, people, or obvious artifacts.

## Run and verify

```sh
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Deployment command: `npm run build`

Deployment output: `dist/` (with `dist/index.html` at its root)

Verification completed 2026-08-27:

- Unit tests: 7 passed (MusicXML semantics/errors, compressed MXL, local persistence, license return and verification cache).
- Playwright: 8 passed across desktop Chromium and a 390 × 844 mobile viewport; covers import → mark → note → reload, keyboard flow, legal routes, and empty/populated axe scans.
- axe: no serious or critical issues in empty or populated states on either viewport.
- Factory `verify-url.sh`: HTTP 200, title present, `lang="en"`, exactly one `h1`, main landmark present, zero missing image alts, zero console/page errors.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.4 s, total blocking time 70 ms, CLS 0.
- Production output: initial app JS 34.57 KB raw / 13.69 KB gzip; CSS 18.26 KB raw / 4.96 KB gzip; mobile hero 12.5 KB. All are below the product budgets.
- `npm audit`: zero vulnerabilities.

## Known gaps and next steps

- The sightline is intentionally a compact rehearsal cue, not full engraving or synthesized playback. Players should keep the source score open for exact articulation, dynamics, and layout.
- V1 supports partwise MusicXML. Timewise files receive an actionable re-export message. PDF/OCR, collaboration, a score marketplace, and copyright-content distribution remain explicit non-goals.
- The browser keeps one active score plan at a time; JSON backups provide portable archival. A future Studio revision could add an on-device multi-score library without changing the privacy model.
- The factory must register the paid product and confirm the US$12 price/return URL before release. The app intentionally uses the slug-based Sociobot endpoint and contains no provider product ID or secret.
