# Independent verification — FAIL

**Work order:** `rehearsal-sightline-verify-1`  
**Verified commit:** `8e34bff1f8e3580e39b30230761fe5112175a31f`  
**Live URL:** https://rehearsal-sightline.sociobot.in/  
**Date:** 2026-08-27

## Verdict

**FAIL.** The current release works for the core rehearsal-planning workflow, but the PWA cannot reliably update already-installed/returning clients. This violates the required service-worker update check and risks keeping players on stale application code after a deploy.

## Blocking defect

### High — service-worker cache is not release-versioned

`public/sw.js:1` hard-codes `const CACHE = 'sightline-v1'`. The worker precaches `/index.html` into that cache (`:3`) and answers every request cache-first (`:7`), including navigations. It also retains exactly that same cache during activation (`:4`).

Consequently, a changed application deployment can have new hashed JS and a new `index.html`, while clients controlled by the existing worker continue to receive the old cached HTML and old hashed script. Even a changed worker body would re-use `sightline-v1`, so activation does not replace the cached shell. There is no build-generated cache version or revision manifest. The application has been confirmed to register this worker and to create the `sightline-v1` cache both locally and on the live origin.

**Reproduction:** visit the production build once, allow `/sw.js` to control the page, then deploy an application-only change (or a worker change retaining the fixed cache name). Reload while controlled: the worker's `caches.match(request)` returns the old cached `/index.html` before the network, so the current release cannot be adopted. This is a stale-shell/update failure, not merely an offline limitation.

**Required remediation:** generate a unique cache name/revision per build (and clean prior revisions on activate), or use a cache strategy that network-refreshes navigations. Test an old controlled client through a build change and an offline reload before re-submitting.

## Quality gates and product exercise

All commands were run from a clean checkout at the verified commit. `npm ci` reported zero vulnerabilities. The first browser-suite attempt could not start solely because the disposable image lacked the declared Playwright Chromium binary; after `npx playwright install chromium`, the exact command passed.

| Check | Evidence | Result |
| --- | --- | --- |
| Install / unit | `npm ci`; `npm test` | PASS — 3 files, 7 tests |
| Type check / production build | `npm run build` (`tsc --noEmit && vite build`) | PASS — `dist/` produced |
| Browser integration | `npm run test:e2e` after installing Chromium | PASS — 8/8, desktop and 390 × 844 mobile |
| Axe | Project Playwright axe scans on empty and populated states, both viewports | PASS — no serious or critical findings |
| Lighthouse mobile | Local production preview, Chrome 151 | PASS — Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1,056 ms; TBT 0 ms; CLS 0 |
| Bundle budget | Built JS 34,574 B raw / 13,690 B gzip; CSS 18,258 B raw / 4,960 B gzip; mobile hero 12,450 B | PASS — below 200 KB JS / 50 KB CSS / 300 KB hero budgets |

Independent browser exercise on the production build covered:

- Imported `tests/fixtures/rehearsal.musicxml`, selected the parsed part, added a four-measure slice, entered and persisted a player note, and confirmed print availability.
- Tested bad XML recovery (`<hello/>`): “This XML file is not a MusicXML partwise score.”
- Tested an inverted range (start 5, end 1): “Choose an end measure at or after 5.” Then corrected it and added the range.
- Deleted a range with confirmation and restored it through Undo.
- Verified keyboard-first entry: first Tab reaches the visible skip link; focus is visibly transformed into view; existing suite covers arrow-key navigation and `L` range creation without a trap.
- Confirmed a 390 px viewport has `scrollWidth === clientWidth === 390`, reduced-motion CSS is present, and no console or page errors occurred during normal use.
- Verified first-visit offline reload after service-worker control succeeds. This does not mitigate the update defect above.

## Privacy, deployment, and delivery checks

- Local MusicXML workflow made no outbound requests. On the live empty state, browser capture found no third-party requests. After an explicit license-token submission, the only external request was the documented Sociobot verification endpoint (`https://api.sociobot.in/api/v1/products/rehearsal-sightline/verify?...`). No analytics, CDN fonts/scripts, or score upload was observed.
- Local storage is used for the active score plan and license verdict as documented. Privacy and Terms routes load directly.
- Live deployment exactly matches the candidate output: SHA-256 values matched for `dist/index.html`, `dist/assets/index-E4PTaPSi.js`, and `dist/sw.js`. The live site registered `/sw.js`, was controlled by it, and had the same `sightline-v1` cache.
- Live headers: HTML 200 with 30-second revalidation; hashed JS/CSS 200 with `public, max-age=31536000, immutable`; `sw.js` 200 with `no-cache`. HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and the camera/microphone/geolocation permissions policy are present. No CSP header was supplied (recorded as a hardening observation, not the blocking verdict).
- HTML has `lang="en"`, a title, exactly one h1, a main landmark, a skip link, and an informative hero-image alt. The deployed 390 px page had no console/page errors or unexpected external requests.

## Reverify after remediation

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Additionally, install/control an old production build, deploy a changed build, verify it fetches the new shell and assets, then repeat an offline reload. Do not mark this candidate releasable until that update path passes.
