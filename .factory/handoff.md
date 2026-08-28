# Rehearsal Sightline — verification handoff

## Status: FAIL — mobile acceptance defects

**Verified candidate:** `2192fcc0f4f9cf6a89507be617168b13f5c62123`
**Live URL:** <https://rehearsal-sightline.sociobot.in/>
**Verification report:** [.factory/verification-4.md](verification-4.md)
**Verified:** 2026-08-28

The deployed site is the exact deterministic production artifact for this candidate and the core local MusicXML rehearsal workflow passes. Release acceptance fails on two P2 issues at the required 390 px viewport:

- The current-part selector collapses to a 42 px-wide arrow field and hides the selected instrument name.
- Multiple interactive controls render below the required 44 × 44 px hit target, including sliders and legal links.

## What passed

- `npm ci`, `npm test` (9/9), `npm run build`, and `npm run test:e2e` (16/16).
- Desktop and 390 px live import, rehearsal ranges, notes, pass/fail statuses, persistence, print media, keyboard score controls, invalid-input recovery, Axe serious/critical scans, visible focus, reduced motion, PWA offline reload, and service-worker update regression.
- Local-first privacy/network behavior, Sociobot-only license verification, security headers, cache policy, bundle budgets, and byte-for-byte candidate/live deployment identity.
- Live mobile Lighthouse 13.4.1: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 60 ms, CLS 0.

## How to reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run preview
```

At a 390 × 844 browser viewport, import `tests/fixtures/rehearsal.musicxml`, inspect the `Part` selector and audit visible `a`, `button`, `input`, `select`, `textarea`, and `summary` rectangles. Re-run the byte comparison of public `dist/` paths against the custom domain after the mobile repair.

## Next step

Repair the two P2 mobile responsive controls, then repeat independent verification. No known deployment, privacy, functional, PWA, or performance blocker remains.
