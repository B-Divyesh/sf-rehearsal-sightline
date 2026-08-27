# Independent verification 2 — FAIL

**Work order:** `rehearsal-sightline-verify-2`

**Candidate commit:** `9fda18cfd15fba3c488aeae9c9320c7987daee1a`

**Live URL:** https://rehearsal-sightline.sociobot.in/
**Verified:** 2026-08-27

## Verdict

**FAIL.** The candidate is deployed and its core local-first MusicXML workflow is largely sound, but it has two reproducible state-feedback defects in central rehearsal-status and license-return paths, plus a focus-indicator contrast violation. It does not meet the work order's end-to-end and accessibility acceptance contract without remediation.

## Defects

### P2 — Changing a slice to Passed or Needs work leaves the visible result stale

The range `change` handler updates and persists `range.status`, but does not render. The `Passed`/`Needs work` stamp and queue counter therefore still report the previous status until an unrelated render (for example, page reload or navigation).

Fresh production-build reproduction:

1. Import `tests/fixtures/rehearsal.musicxml` and add a rehearsal slice.
2. Change Result from `Planned` to `Passed`.
3. Immediately observe: select value = `passed`; visible stamp = `Planned`; counter = `0 passed`.
4. Reload: select = `passed`; stamp = `Passed`; counter = `1 passed`.

This is a visible contradiction in the product's core pass/fail planning feature. The persisted data is correct, but feedback is not immediate or truthful.

### P2 — An invalid returned Studio license remains shown as “Verifying”

On a fresh live visit to `/?license=qa-invalid-token`, the token is correctly stored and stripped from the address bar, and the product requests the documented Sociobot verification endpoint. The endpoint returns `200 {"valid":false,"reason":"invalid"}`. Because the prior and returned unlock values are both false, `reconcileLicense()` does not update `notice` or re-render. The toast remains `License received. Verifying your Studio unlock…` after verification has finished.

This contradicts the required quiet, clear “license no longer active” outcome for an invalid return token. Manual Restore does show an error correctly; the URL-return path does not.

### P2 — Keyboard focus indicator misses the required 3:1 contrast on light surfaces

The sole global visible-focus color is `#e49a38` (`src/style.css:32`). Its contrast is 2.21:1 against the documented page field `#f7f9f8`, and 2.34:1 against white, below the attached accessibility requirement of at least 3:1 for focus/UI indicators. Keyboard Tab does visibly apply this orange 3 px outline, so this is a color-contrast failure rather than an absent-focus failure. Axe/Lighthouse do not flag it; the ratio was independently calculated from the shipped CSS tokens.

### P3 — Response-policy hardening opportunity

The live response has HSTS, `nosniff`, strict-origin referrer policy, and restrictive camera/microphone/geolocation permissions policy. It does not send a Content-Security-Policy or frame-ancestors/X-Frame-Options policy. This is not the reason for the verdict, but should be addressed for a site that accepts a license token in its return URL.

## Quality gates

All work began from a clean checkout at the candidate SHA. No product code was modified.

| Check | Fresh evidence | Result |
| --- | --- | --- |
| Install | `npm ci` | PASS — 99 packages audited, 0 vulnerabilities |
| Unit tests | `npm test` | PASS — 3 files, 7 tests |
| Type check + exact production build | `npm run build` | PASS — `tsc --noEmit`; `dist/` produced |
| Browser integration | `npm run test:e2e` | PASS — 10/10 in 36.8 s; desktop and 390 × 844 mobile |
| Axe | Fresh Playwright Axe scans of live empty and populated states | PASS — 0 serious/critical (and 0 total) violations |
| Lighthouse mobile | Local production preview, Lighthouse 13.4 / Chrome 151 | PASS — Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.5 s, TBT 140 ms, CLS 0 |
| Bundle budgets | Build output | PASS — JS 34,574 B raw / 13,690 B gzip; CSS 18,258 B raw / 4,960 B gzip; mobile hero 12,450 B |
| PWA update + offline | Configured service-worker test in both projects | PASS — old controlled release updates, stale cache removed, new shell reloads offline |

No lint script is defined in `package.json`; the build's `tsc --noEmit` is the available static type check.

## Independent product exercise

On the exact production build, and at both desktop and 390 px widths, I verified:

- Empty state, direct Privacy/Terms routes, title, one h1, main landmark, skip link, no horizontal page overflow, and no console/page errors.
- Normal flow: import representative partwise MusicXML, parse title/part/five measures, create four rehearsal slices, add a note, export JSON backup (`north-window-study-sightline.json`), remove with confirmation, undo removal, and persist across reload.
- Boundary/error/recovery: a 25 MiB + 1 B score gives the 25 MB error and a subsequent valid import succeeds; malformed XML gives an actionable parse error and recovery succeeds; inverted range 5 → 2 gives `Choose an end measure at or after 5.` and corrected range adds successfully. Unit coverage also passes for compressed `.mxl` and timewise XML rejection.
- Keyboard: Tab reaches the skip link and all tested controls; configured suite passes Arrow navigation and `L` range creation without a trap. Reduced-motion media query reduces transition duration to 0.01 ms.
- Print: enabled after a queued range and uses the dedicated print cue-sheet view (browser print dialog is not automatable in headless Chromium).

## Privacy, deployment, network, and browser policy

- The free live workflow made only same-origin requests: HTML, hashed JS/CSS, local hero, manifest/worker. There were no analytics, advertising, score uploads, CDN scripts, or third-party fonts. Imported score data is held in localStorage as documented.
- A deliberate invalid license return made exactly one external request, to the documented `https://api.sociobot.in/api/v1/products/rehearsal-sightline/verify?...`; the API returns `Cache-Control: no-store` and CORS support. Checkout remains a plain Sociobot link. No payment provider is embedded.
- Candidate/live identity: live `index.html` SHA-256 is exactly the freshly built `dist/index.html` (`f597c448b99850062135dabcd95ce38d467431ece0d8056073c31a454d8a27a3`). Live JS, CSS, and mobile hero SHA-256 values exactly match candidate build artifacts. `sw.js` differs only in its intended per-build cache nonce; it has the same current shell asset list and `Cache-Control: no-cache`.
- Live caching: HTML routes `public, must-revalidate, max-age=30`; hashed JS/CSS and hero assets `public, max-age=31536000, immutable`; worker `no-cache`. HTTP redirects to HTTPS. HSTS, `nosniff`, strict-origin referrer policy, and the declared Permissions-Policy are present.

## Reverify after fixes

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Then repeat the three defect reproductions above, including a real keyboard focus contrast check and an invalid `?license=` return on the live candidate.
