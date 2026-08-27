# Independent verification 3 — FAIL

**Work order:** `rehearsal-sightline-verify-3`  
**Candidate commit:** `03ad5ed11ea3b767cbe66e3246ca9e6f144fe8ea`  
**Live URL:** <https://rehearsal-sightline.sociobot.in/>  
**Verified:** 2026-08-27

## Verdict

**FAIL for release acceptance.** The application itself passes the functional, privacy, accessibility, performance, and PWA checks below. However, the live deployment cannot be verified as the candidate artifact: the deployed service worker differs from both the candidate's recorded deployed hash and the fresh candidate build. The difference is only its time-derived cache nonce, so this is a deployment identity/reproducibility failure rather than a user-facing workflow failure.

## Defects

### P1 — The deployed static artifact is not identifiable as candidate `03ad5ed`

Fresh live `sw.js` is SHA-256 `73586939ff0a31b16882112d1f082d3edf4eb168328e6bb7ac7752abcb366e25`, whereas:

- the candidate's own handoff records deployed `sw.js` as `dbfa93c851e10ef0c63f6251401ecee3efad2359cb486cc0f2dc5a67da5f528b`;
- a clean `npm ci && npm run build` at `03ad5ed` generated `80cf7c93716bbd5583ea93f7abf12974b93947bda8928b3d3900bf8fbbee86b1`.

The live worker and fresh worker have the same shell list and code. Their sole textual difference is `const CACHE`: live uses `sightline-bab9cffc230eb7ba`; the clean build uses `sightline-04676e9b8d56fde3`. `vite.config.ts` intentionally hashes `Date.now()` into that value, meaning identical source builds are not byte-reproducible. Consequently the current deployment cannot be tied unambiguously to this candidate, and the candidate's prior deployment-hash claim is stale or incorrect.

All other checked live bytes do match the clean candidate build: `index.html` `b80b32b8…adf79`, JS `440dba0e…3327b`, CSS `d7243a40…9accb`, mobile hero `e4ae5c99…15f7`, and manifest `f54ce6fd…5617a`.

## Quality gates

All commands below were run in an isolated clean clone at the candidate SHA. No product source code was modified.

| Check | Fresh evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci` | PASS — 100 packages audited; 0 vulnerabilities |
| Unit/integration | `npm test` | PASS — 4 files, 8 tests |
| Static type check / exact production command | `npm run build` | PASS — `tsc --noEmit`, Vite build, `dist/` created |
| Available lint | `package.json` defines no lint script | N/A — type check is included in build |
| Browser integration | `npm run test:e2e` | PASS — 16/16 in 47.8 s, desktop and 390 × 844 mobile, including PWA update/offline test |
| Live smoke | `/opt/fleet/lib/verify-url.sh` | PASS — 687 ms; title, `lang`, one h1, main, image alt, labeled buttons, zero errors |
| Axe serious/critical | Independent Playwright Axe scans of live empty and populated states | PASS — none |
| Lighthouse mobile | Lighthouse 13.4.0, live URL, performance preset | PASS — Performance 98, Accessibility 100, Best Practices 100, SEO 100; FCP 1.8 s, LCP 2.2 s, TBT 0 ms, CLS 0 |
| Bundle budget | candidate `dist/` | PASS — JS 34,705 B raw / 13.73 KB gzip; CSS 18,362 B raw / 4.99 KB gzip; mobile hero 12,450 B; no downloaded fonts |

## Independent product exercise

On the fresh production build, at desktop and 390 px mobile widths:

- Imported the representative partwise MusicXML fixture, selected the part, created four rehearsal slices, marked a result, entered a player note, exported and parsed `north-window-study-sightline.json`, removed a slice with confirmation, undid it, and verified local persistence after reload.
- Reproduced recovery paths: malformed XML showed the actionable MusicXML error then accepted a valid score; a 25 MiB + 1 B file showed the size error; inverted measure 5 → 2 showed `Choose an end measure at or after 5.` and a corrected range saved; invalid JSON backup showed its actionable error.
- Exercised keyboard-only navigation: Arrow measure movement and `L` slice creation worked, focus was visible, and focus contrast is covered by the browser regression. At 390 px there was no document horizontal overflow. Under reduced motion, the range-card transition computed to `0.00001s`.
- The repaired status feedback is immediate: setting Passed produced the `Passed` stamp, `1 passed` counter, and announced confirmation without reload.
- The live PWA registered `/sw.js`, controlled the page, and reloaded offline with the h1 present. The repository's update test also passed, proving stale-cache removal and new-release offline reload.

## Privacy, network, policies, and deployment

- The live free workflow made only same-origin requests; no score upload, analytics, ads, CDN scripts, or third-party fonts were observed. Score/plan storage is localStorage as described in Privacy.
- A fresh live `?license=qa-invalid-token` visit made one documented request to `https://api.sociobot.in/api/v1/products/rehearsal-sightline/verify?license=qa-invalid-token`, stripped the token from the URL, and displayed `License no longer active. You can purchase again or restore another license.`
- Live headers: HTTPS/HSTS, `nosniff`, `strict-origin-when-cross-origin`, restrictive Permissions-Policy, CSP with `frame-ancestors 'none'`, and `X-Frame-Options: DENY`. HTML is `public, must-revalidate, max-age=30`; hashed JS/CSS are `public, max-age=31536000, immutable`; `sw.js` is `no-cache`.
- The live worker's shell references the exact matching candidate HTML, JS, CSS, hero, manifest, and mark files, so no functional mismatch was observed. The P1 identity mismatch above remains the reason this report is FAIL.

## Required release follow-up

Deploy a build artifact with a deterministic service-worker revision (for example, derive the revision solely from precached bytes or an explicit recorded release ID), then compare and record SHA-256 values for every deployed file. Re-run the live identity check before marking the candidate accepted.
