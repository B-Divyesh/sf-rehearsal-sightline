# Rehearsal Sightline — repair handoff

## Status: PASS — deployed and identity verified

**Repair base:** independent verification 3 at `c45a8dbd5e56484de1e4283916c97d18d915ac7e`, for candidate `03ad5ed11ea3b767cbe66e3246ca9e6f144fe8ea`
**Repair commit:** `7ddb9758d1ff1473114442bfd82ac8bb6400e9c3`
**Artifact class:** unchanged `static-web` (Vite + TypeScript; deploy root is `dist/`)
**Live URL:** <https://rehearsal-sightline.sociobot.in/>
**Azure deployment:** `d98da510-9f0e-41e8-9eaa-33927b12b7a6` — succeeded 2026-08-28

## Repair

Independent verification 3 found one release-blocking P1: `vite.config.ts` mixed `Date.now()` into the service-worker cache revision. Identical sources therefore emitted different `sw.js` bytes, preventing a live artifact from being identified as the candidate.

- Replaced the time-derived revision with a deterministic SHA-256 digest of the sorted precache paths and their bytes (with explicit separators). The cache still changes when any cached shell asset changes, and stale cache removal/update behavior is unchanged.
- Moved worker generation into `src/release-worker.ts` so its deterministic behavior is directly testable.
- Added `src/release-worker.test.ts`: two independent equivalent output directories generate byte-identical workers/cache names; changing a precached JS byte generates a new cache name. This is the exact regression for the verifier finding.
- Stabilized the existing keyboard-only browser regression by moving focus from the file input to the reading surface before sending global score shortcuts. The product intentionally does not invoke global shortcuts while a form field has focus; no product behavior changed.

## Verification (2026-08-28)

| Check | Evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci` | PASS — 100 packages audited, 0 vulnerabilities |
| Unit/integration | `npm test` | PASS — 5 files, 9 tests, including deterministic worker regression and response-policy coverage |
| Type check / production build | `npm run build` | PASS — `tsc --noEmit`, Vite output in `dist/` |
| Reproducible artifact | Two consecutive `npm run build` runs; `cmp` of `sw.js` | PASS — both SHA-256 `33188b157c26076ad28a00786b418798e405f3783a2d5fffac626831b51d213a` |
| Browser: desktop + 390 × 844 mobile | `npm run test:e2e` | PASS — 16/16: import/local persistence, legal routes, keyboard, status feedback, invalid license return, focus contrast, Axe, and PWA update/offline reload |
| Accessibility | Playwright Axe empty/populated states plus live `verify-url.sh` | PASS — no serious/critical Axe violations; live page has title, `lang`, one h1, main, image alts, labeled buttons, and zero console/page errors |
| Keyboard / reduced motion | Browser regression runs both projects; score Arrow and L commands exercised from reading surface | PASS — visible focus and no focus trap retained |
| Privacy / network | Live 390 px Playwright import exercise | PASS — requests had only `https://rehearsal-sightline.sociobot.in` origin; no score upload, analytics, CDN, or third-party font request |
| Offline / update | Browser update regression plus live mobile worker exercise | PASS — stale cache removal/new-release offline reload; live `/sw.js` controlled the page and offline reload rendered the h1 with zero errors |
| Response / security policy | `src/response-policy.test.ts` and live `sw.js` headers | PASS — same-origin scripts, Sociobot-only license connect allowlist, `frame-ancestors 'none'`, XFO DENY, HSTS, nosniff, referrer and permissions policies; worker `no-cache` |
| Bundle budget | production `dist/` | PASS — JS 34,705 B raw / 13,631 B gzip; CSS 18,362 B raw / 4,994 B gzip; mobile hero 12,450 B; no downloaded fonts |
| Lighthouse mobile, live | Lighthouse 13.4.0 performance preset | PASS — Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.5 s, LCP 2.0 s, TBT 0 ms, CLS 0 |
| Package / consumer | Not applicable: this remains a static Vite web artifact, not a published package |

## Deployment identity evidence

`/opt/fleet/lib/deploy-static.sh rehearsal-sightline dist` deployed the verified build. After deployment, every public file was fetched from the custom domain and compared byte-for-byte to `dist/`; all matched. The deployment configuration file is consumed by Azure rather than exposed as a public artifact and is covered by the response-policy test above.

| Public artifact | SHA-256 (local = live) |
| --- | --- |
| `assets/hero-ceramic-score-1280.webp` | `915914a446a686b2a7c26d4cc8c5b5d3f965be14baf26b533c17bf3e0c2e5eb2` |
| `assets/hero-ceramic-score-768.webp` | `e4ae5c9905cd1534dc648a3619b6f9fb9646a97c40ba2040f37eb3e7b97b15f7` |
| `assets/index-CNuuj42-.js` | `440dba0ebf4bb59d2eaf2e208ce3fc7243b16c5b0fc6d6569fce88a97c83327b` |
| `assets/index-WSrbNVnD.css` | `d7243a40ddee28ec4e198dd51c3f2a4b9e0bb9d432ee6e8b560d72a78159accb` |
| `index.html` | `b80b32b8b596af1ea694f887fea32d32f0f88b1f2a8c959513d7d79cf79adf79` |
| `manifest.webmanifest` | `f54ce6fdc9783b4f0ac9cc7351c4c37837f54b5ae86502f3574cd02360d5617a` |
| `mark.svg` | `8937f0706f1ffe79da4934f002eda77994e1691d25187b8f98a5f1e653ea8691` |
| `robots.txt` | `c63065cbb07a072ecedaa96612f339ff20d09be3315431e090a29fa15e0cbcef` |
| `sitemap.xml` | `9ea0fa8f8c63813faea41ce0fd0e3f05719f396f33d117f127d16fa24c987b2c` |
| `sw.js` | `33188b157c26076ad28a00786b418798e405f3783a2d5fffac626831b51d213a` |

## How to run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run preview
```

For release identity, build twice and compare `dist/sw.js`; then fetch every public path in `dist/` from the deployed origin and compare SHA-256 values. The worker cache revision is now derived only from those precached bytes, so the same source build is byte-reproducible.

## Known product scope

- V1 intentionally supports partwise MusicXML only; re-export timewise MusicXML as partwise. PDF/OCR, collaboration, score distribution, full engraving, and synthesized playback are out of scope.
- The browser retains one active plan locally; JSON backup is the portable archive.
