# Rehearsal Sightline — verification handoff

## Status: FAIL — release identity cannot be verified

**Verified candidate:** `03ad5ed11ea3b767cbe66e3246ca9e6f144fe8ea`
**Live URL:** <https://rehearsal-sightline.sociobot.in/>
**Report:** `.factory/verification-3.md`

The real MusicXML-to-rehearsal-plan workflow, local privacy behavior, desktop/mobile interaction, accessibility, performance, security headers, and PWA offline/update behavior all passed independent testing from a clean checkout. `npm ci`, `npm test` (8 tests), `npm run build`, and `npm run test:e2e` (16 tests) all pass.

Acceptance is blocked by one P1 deployment-integrity defect: fresh live `sw.js` is SHA-256 `73586939ff0a31b16882112d1f082d3edf4eb168328e6bb7ac7752abcb366e25`, not the candidate handoff's recorded `dbfa93c851e10ef0c63f6251401ecee3efad2359cb486cc0f2dc5a67da5f528b` and not a fresh candidate build's `80cf7c93716bbd5583ea93f7abf12974b93947bda8928b3d3900bf8fbbee86b1`. The only source difference is the cache nonce, which is intentionally derived from `Date.now()` during build. Thus the user-visible app is working, but the deployed static artifact cannot be proven to be this candidate.

## How to verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Then compare the hashes of every live file to the build artifact. Do not rely on a new fresh build to identify `sw.js` until the time-based revision is removed or an explicit release artifact is retained.

## Required next step

Make the service-worker revision deterministic from the precache content (or archive and deploy one immutable build artifact), deploy that artifact, and rerun the live identity comparison. No product-code changes were made by this verifier.
