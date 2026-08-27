# Rehearsal Sightline — repair handoff

## Status: READY TO DEPLOY

This repair resolves the independent verifier's high-severity PWA update blocker from candidate `8e34bff1f8e3580e39b30230761fe5112175a31f`.

### What changed

- The service worker is now generated into `dist/sw.js` after every production build. Its `sightline-<revision>` cache name combines the exact precache contents with a per-build nonce, so a repeated deployment and a worker-only change both receive a fresh cache.
- The generated worker precaches the built shell and local assets, removes only prior `sightline-` revisions on activation, claims clients immediately, and serves navigations network-first. An old controlled client therefore receives the new HTML on its next online reload; its current shell remains available when it is offline.
- Added `tests/service-worker-update.spec.ts`, an exact browser regression. It installs an old controlled release, swaps the server to a new generated release, verifies the new shell and cache replace the old revision, then sets the browser offline and verifies the new shell reloads from cache. It runs in both the desktop and 390 × 844 mobile projects.

The researched brief, local-first MusicXML workflow, visual system, legal routes, paid-unlock behavior, and deployment class are unchanged.

## Run and verify

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run build` type-checks and creates `dist/` with `index.html` at its root and a release-generated `sw.js`. `npm run test:e2e` requires that production build and exercises desktop Chrome plus the 390 px mobile viewport.

## Repair verification evidence

All commands below ran on 2026-08-27 from a clean install in this repair workspace.

| Check | Evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci` | PASS — 99 packages audited; 0 vulnerabilities |
| Unit / integration | `npm test` | PASS — 3 files, 7 tests |
| Type check / production build | `npm run build` | PASS — `tsc --noEmit`, Vite build, and generated `dist/sw.js` |
| Browser, desktop + mobile | `npm run test:e2e` | PASS — 10/10; core import/queue/persistence, keyboard, legal routes, axe scans, and the exact PWA update/offline regression in both projects |
| Accessibility | Playwright axe on empty and populated states | PASS — no serious or critical violations |
| Smoke / response basics | `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173` | PASS — title, `lang`, one h1, main landmark, image alt coverage, labeled buttons, and zero console/page errors |
| Privacy | Production-preview request capture | PASS — empty workflow made requests only to `http://127.0.0.1:4173`; no analytics, CDN, font, score-upload, or other third-party request |
| Cache/update/offline | `tests/service-worker-update.spec.ts` | PASS — old controlled revision replaced by the generated current revision, stale cache removed, and new shell reloads while browser context is offline |
| Bundle budget | built app JS 34,574 B raw / 13,688 B gzip; CSS 18,258 B raw / 4,963 B gzip | PASS — below 200 KB JS and 50 KB CSS budgets |
| Lighthouse mobile | local production preview, Chrome 151 | PASS — Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1,355 ms, TBT 37 ms, CLS 0 |
| Response policy | `public/staticwebapp.config.json` plus local `/sw.js` response | PASS — deployment config keeps immutable hashed assets, `sw.js` `Cache-Control: no-cache`, SPA fallback, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation restrictions |

## Deployment

Artifact class remains `static-web`; deploy `dist/` to Azure Static Web Apps. Post-deployment verification must confirm that the live origin serves the just-built `sw.js` cache revision, preserves the `no-cache` worker header, has no unexpected external first-load requests, and passes the old-client update/offline scenario above.

## Known gaps / next steps

- The sightline is intentionally a compact rehearsal cue, not full score engraving or synthesized playback. Keep the source part open for exact articulation, dynamics, and layout.
- V1 accepts partwise MusicXML. Timewise MusicXML should be re-exported as partwise. PDF/OCR, collaboration, and score distribution remain intentional non-goals.
- The browser stores one active plan locally. JSON backups remain the portable archival path.
