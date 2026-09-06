# Rehearsal Sightline handoff

## Status: ready for review

Rehearsal Sightline helps orchestra and band players turn their own MusicXML score into manageable rehearsal slices with a look-ahead view and printable cue sheet.

- Deployed implementation: `cab4a8f0cc707d6579137f7863f497dec2cc2cfa`
- Main repair implementation: `4cb6e88403a4402d9478e4ee369b2d07036b0254`
- Documentation handoff commit: recorded by the following report-only commit.
- Live URL: https://rehearsal-sightline.sociobot.in
- Build output: `dist/`

## What changed

- Added the one-click `/demo` sandbox. It opens an original eight-measure `North Window Study` sample with four marked slices. Demo state uses only `demo:rehearsal-sightline:*` local-storage keys; real plans and licenses are neither read nor written. The persistent banner explains this, offers Reset demo, and Start for real discards the sandbox.
- Added `.factory/claims.json` with 15 public claims and exactly one tagged, outcome-based browser test for each. Tests operate through the demo entry point, including the offline test in its own browser context.
- Replaced the broken Studio checkout action with a clear registration-pending status. The $12 one-time Studio offer, paid features, license restoration, validation, and terms remain stated. No visitor is sent to the known 404 endpoint.
- Added `/demo`, `/privacy`, `/terms`, and `/privacy-request` direct routes; route-specific initial and client-side metadata; screen-reader route announcements; focus restoration; a styled HTTP 404; sitemap, canonical/OG/Twitter tags, favicon/apple touch icon, and security headers.
- Reworked the landing first screen and sections in plain language. It states the job, intended players, and `Try it with sample data` first action before scrolling.
- Kept and retested the free workflow: MusicXML import, part choice, look-ahead, keyboard stepping, range notes and results, cue-sheet printing, plan backup, local restore, offline reload, invalid input/recovery, and undo.

## Billing dependency

Sociobot billing registration for `rehearsal-sightline` is still required before checkout can be enabled. The prior checkout endpoint returned HTTP 404, so it is not linked. This is an external registration dependency, not an invented or mocked payment flow. Public offer metadata is recorded at `/work/.evidence/billing-offer.json`; it names the actual $12 USD one-time Studio offer, live origin, paid features, and license verification path. The free core remains fully usable.

## Verification

From a clean dependency install:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

- `npm test`: 11 passed.
- `npm run build`: passed; initial JS is 16.33 KB gzip and CSS is 5.48 KB gzip.
- `npm run test:e2e`: 54 passed on desktop and 390 px mobile.
- Every command listed in `.factory/claims.json` was run individually against this final candidate; each passed on desktop and mobile.
- Playwright Axe checks found zero violations on the live landing page and live demo. The complete browser suite also checks empty, populated, mobile, keyboard, focus, reduced-motion, direct-route, privacy-request, designed-404, offline/update, invalid, boundary, and recovery paths.
- `/opt/fleet/lib/verify-url.sh https://rehearsal-sightline.sociobot.in /work/.evidence/live-smoke-final-2` passed: HTTPS 200, no console errors, title/lang/main/alt checks pass, and zero unlabeled buttons.
- Fresh live desktop and phone contexts confirmed the first-screen job/action, four populated sample ranges, persistent demo label, reset from three ranges back to four, demo-only storage, real-data exit, direct Privacy title, and HTTP 404 with a functional return link. Screenshots are in `/work/.evidence/`.
- Lighthouse live mobile: Performance 100, Accessibility 100, LCP 1.1 s, CLS 0.

`npx @axe-core/cli` could not use the container's Playwright Chromium because its bundled global ChromeDriver only supports Chrome 152 while Playwright ships Chromium 145. The required equivalent Playwright Axe integration ran against the live landing and demo and reported zero violations.

## Product documents

- Demo contract: `.factory/demo.md`
- Claims and commands: `.factory/claims.json`
- Landing-copy audit: `.factory/copy-audit.md`
- Catalog description: `.factory/catalog-description.txt` and `/work/.evidence/catalog-description.txt`
- Visual provenance: `.factory/design.md`

## Remaining work

No known product-code defect remains from review 1. The only named dependency is the external Sociobot billing registration needed to make the existing Studio checkout available. Once registration is complete, enable the hosted checkout link and independently verify payment, return-token storage, and entitlement verification. Do not expose checkout before that registration succeeds.
