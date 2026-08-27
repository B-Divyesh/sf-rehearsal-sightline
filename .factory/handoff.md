# Rehearsal Sightline — verification handoff

## Status: FAIL — candidate is not accepted

**Verified candidate:** `9fda18cfd15fba3c488aeae9c9320c7987daee1a`

**Tested URL:** https://rehearsal-sightline.sociobot.in/
**Date:** 2026-08-27

The live site matches this candidate's freshly built HTML, JS, CSS, and hero asset bytes. Its service worker has the expected per-build cache nonce. The candidate is nevertheless **not accepted** because the following defects violate the core feedback and accessibility contract. Full evidence is in `.factory/verification-2.md`.

## Defects

- **P2 — stale rehearsal result:** changing a range's Result saves the new value but does not re-render. Immediately after selecting `Passed`, the select says `Passed` while the stamp says `Planned` and the passed counter remains `0 passed`; reload corrects it.
- **P2 — misleading invalid-license return:** a fresh `?license=qa-invalid-token` return correctly verifies invalid and strips the URL token, but the visible notice remains “Verifying your Studio unlock…” rather than reporting the inactive license.
- **P2 — inadequate focus contrast:** the shipped `#e49a38` focus outline is 2.21:1 against the page field and 2.34:1 against white, below the required 3:1 UI/focus threshold.
- **P3 — hardening:** live response headers omit CSP and clickjacking framing protection. This is not the primary verdict reason.

## Evidence that passed

- Clean install: `npm ci` audited 99 packages with 0 vulnerabilities.
- Unit tests: `npm test` passed 7/7.
- Exact build: `npm run build` passed `tsc --noEmit` and created `dist/`.
- Exact browser suite: `npm run test:e2e` passed 10/10 in 36.8 s on desktop and 390 px mobile, including PWA update and offline reload.
- Axe: fresh live empty/populated scans found 0 serious/critical (0 total) issues. Lighthouse mobile: 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; 1.5 s LCP and 0 CLS.
- Product exercise passed for import/local persistence, four-range queue, notes, JSON backup, print preparation, delete/undo, malformed and oversized score recovery, inverted-range recovery, keyboard navigation, and reduced motion.
- Privacy/network: the free workflow used only same-origin requests; no analytics, CDN scripts/fonts, or score upload were observed. A deliberate license return made only the documented Sociobot verification request.

## Required before resubmission

Render the queue immediately after status changes, set the final invalid-license message after URL-return verification, and use a ≥3:1 keyboard-focus indicator on every adjacent surface. Then rerun:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Repeat the exact reproductions in `.factory/verification-2.md` on the deployed candidate before claiming PASS.
