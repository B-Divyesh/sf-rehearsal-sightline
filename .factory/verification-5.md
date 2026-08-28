# Independent verification 5 — PASS

**Work order:** `rehearsal-sightline-verify-5`
**Candidate commit:** `077075eb5c2467e754821117a5d4cabd99ceb65a`
**Live URL:** <https://rehearsal-sightline.sociobot.in/>
**Verified:** 2026-08-28

## Verdict

**PASS for release acceptance.** This was a clean-checkout, independent verification of the candidate and its live deployment. The local-first MusicXML rehearsal workflow works on desktop and at the required 390 × 844 mobile viewport, including normal, boundary, recovery, accessibility, privacy, PWA, and deployment-identity checks.

The two P2 mobile findings in verification 4 are fixed on the candidate and in production: the selected part is visible in a 366 × 44 px picker at 390 px, and the complete rendered-control audit found no target smaller than 44 × 44 px. The previously reported deployment-only service-worker identity issue is also resolved: repeated builds produce the same worker and every public production artifact byte-matches the fresh build.

## Defects

None found. No P0, P1, P2, or P3 release defects are open.

## Local quality gates

All commands started from a clean `main` checkout at the candidate SHA. No product code was changed.

| Check | Fresh evidence | Result |
| --- | --- | --- |
| Install | `npm ci` | PASS — 99 packages installed; audit reported 0 vulnerabilities. |
| Unit/integration | `npm test` | PASS — 5 files, 9 tests. |
| Type check and exact production build | `npm run build` | PASS — `tsc --noEmit`, Vite production build, and `dist/index.html`. |
| Lint | `package.json` defines no lint script | N/A — TypeScript check is part of build. |
| Browser integration, desktop | `npx playwright test --project=desktop` | PASS — 9/9, including axe, keyboard, storage, license recovery, touch audit, and PWA update/offline regression. |
| Browser integration, 390 px mobile | `npx playwright test --project=mobile` | PASS — 9/9, same configured suite on 390 × 844. |
| Reproducible service worker | second `npm run build`; SHA-256 before/after | PASS — both `20de7a68c4fd37f6fd2f8c174e519b616da9d0508005d2b48a7b51ff76697425`. |

The configured end-to-end suite is therefore 18/18 passing across its two projects. The repository is a static web app, not a library/CLI/backend; package-consumer, backend-concurrency, and health checks do not apply.

## Independent product exercise

On the live production URL, with the repository's representative two-part partwise MusicXML fixture:

- Imported locally, selected the visible `Clarinet in B♭` part, created five named slices (four normal plus a corrected boundary slice), stored notes, marked one **Passed** and one **Needs work**, reloaded, and confirmed all five persisted. Browser storage contained only `rehearsal-sightline:session:v1`.
- Exported and parsed the plan backup: `format: rehearsal-sightline/v1`, five ranges. Print media exposed five cue-sheet rows. The free workflow therefore covers import, configurable sightline, range planning, pass/fail notes, printable cues, and portable backup.
- Confirmed inverted range recovery: 5 → 2 reports `Choose an end measure at or after 5.` A corrected 5 → 5 range saves successfully.
- Confirmed recovery messages for malformed XML (`This XML file is not a MusicXML partwise score.`), timewise MusicXML (actionable partwise re-export instruction), an invalid plan backup, and a 25 MiB + 1 B score (`That score is over 25 MB...`). Each leaves the app usable.
- Keyboard/browser tests exercised Space, arrow and Shift+arrow navigation, `L` to add a visible slice, Tab focus movement, focus contrast, and no focus trap. The live normal flow recorded no console or page errors.

## Accessibility, responsive, and visual checks

- `/opt/fleet/lib/verify-url.sh https://rehearsal-sightline.sociobot.in <tempdir>`: PASS — 705 ms, title, `lang=en`, exactly one h1, main landmark, no missing image alt, no unlabeled buttons, and no errors.
- Independent live axe scans: **0 serious/critical** violations on both empty and populated 390 px states.
- At 390 × 844 after import, the selected part picker measured **366 × 44 px** and showed `Clarinet in B♭`; document scroll width was exactly 390 px; every visible `a`, `button`, `input`, `select`, `textarea`, and `summary` measured at least 44 × 44 px.
- Under `prefers-reduced-motion: reduce`, the tested score transition duration was `0.00001s`; desktop and mobile rendered without horizontal overflow. Visual inspection found the product-specific ceramic/score system intact and responsive rather than a collapsed desktop layout.
- Live Lighthouse 13.4.1 mobile simulation: **98 Performance, 100 Accessibility, 100 Best Practices, 100 SEO**; FCP 1.0 s, LCP 1.2 s, TBT 160 ms, CLS 0.

## Privacy, policies, PWA, performance, and live identity

- In the ordinary imported-score flow, observed browser requests were only to `https://rehearsal-sightline.sociobot.in`. No score upload, analytics, advertising, third-party font, CDN script, or tracker was observed.
- A fresh `?license=qa-verification-invalid-token` visit made the documented additional request only to `https://api.sociobot.in`, stripped the token from the visible URL, stored it under `sb_license:rehearsal-sightline`, and showed the invalid-license recovery notice. The free workflow never depends on that request.
- The live app registered and was controlled by `/sw.js`; after setting the context offline, a reload rendered the h1 with no errors. The passing local PWA regression additionally verified replacement-release cache cleanup and offline reload after an update.
- Live HTTPS headers include HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, restrictive Permissions-Policy, and a CSP with `default-src 'self'`, `frame-ancestors 'none'`, and Sociobot-only external `connect-src`. HTML uses `public, must-revalidate, max-age=30`; hashed JS/CSS/hero files are `max-age=31536000, immutable`; `/sw.js` is `no-cache`.
- Fresh `dist/` budgets: JS 34,705 B raw / 13,627 B gzip; CSS 18,450 B raw / 4,984 B gzip; mobile hero 12,450 B; no web fonts. All are within the stated static-product budgets.
- Every publicly served build artifact byte-matched its fresh local counterpart: index, hashed JS/CSS, both hero WebP files, manifest, mark SVG, robots, sitemap, and `sw.js`. `staticwebapp.config.json` is deployment configuration and is not a public file (the SPA returns `index.html` at that path); its policy was independently confirmed in live headers and the passing response-policy test.

## Follow-up

No product follow-up is required for this candidate. Repeat the commands in the local-gates table to verify a future change.
