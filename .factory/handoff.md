# Rehearsal Sightline — repair handoff

## Status: PASS — ready for deployment verification

**Repair base:** `dabb7c41f8f86a67d135f9ada537b4f6810b3d4f` (independent verification report for candidate `9fda18cfd15fba3c488aeae9c9320c7987daee1a`)

**Artifact class:** unchanged `static-web` (Vite + TypeScript; `dist/` contains the deploy root).

## Repairs

- Rehearsal Result changes now persist and immediately re-render the slice stamp, passed counter, and an announced confirmation. The prior persisted-data-but-stale-UI failure is eliminated.
- A returned `?license=` now always renders the completed verification result, including the required quiet inactive-license notice when the result is invalid. The token is still stripped from the URL and the free workspace remains available.
- Replaced the failing orange focus outline with a `#69716f` neutral focus token (4.74:1 against the page field; 5.01:1 against white; 3.23:1 against the dark surface). Cobalt primary controls receive an ice outline (6.86:1 against cobalt).
- Added Content-Security-Policy and `X-Frame-Options: DENY` in Azure Static Web Apps deployment configuration. The CSP permits only local assets/scripts and the documented Sociobot license verification endpoint.
- Pinned `@playwright/test` to `1.58.2`, matching the worker-provided browser revision so a clean install can execute browser checks reproducibly.

## Regression coverage

- Browser regression: changing a range to Passed immediately changes both the visible stamp and the passed counter, then survives reload.
- Browser regression: a CORS-accurate invalid license return strips the URL token and displays “License no longer active” after verification. This test blocks service workers so its controlled verification response is deterministic; PWA behavior remains covered separately.
- Browser regression: calculated focus contrast is at least 3:1 on the light field and cobalt primary control.
- Unit regression: the deployment configuration must retain CSP, framing protection, same-origin scripts, and the Sociobot verification allowlist.

## Verification run (2026-08-27)

| Check | Evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci` | PASS — 100 packages audited; 0 vulnerabilities |
| Unit / integration | `npm test` | PASS — 4 files, 8 tests |
| Type check / production build | `npm run build` | PASS — `tsc --noEmit`, Vite production build, and generated `dist/sw.js` |
| Browser desktop + 390 px mobile | `npm run test:e2e` | PASS — 16/16: imports, local persistence, legal routes, keyboard, immediate status feedback, invalid-license return, focus contrast, axe, and service-worker update/offline reload |
| Accessibility | Playwright Axe in empty and populated states | PASS — no serious or critical violations |
| Smoke | `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 /tmp/rehearsal-sightline-evidence` | PASS — title, `lang`, one h1, main landmark, alt coverage, labeled buttons, and no page/console errors |
| Privacy / network | Production-preview Playwright exercise imported a score and created a slice | PASS — only `http://127.0.0.1:4173` requested; no score upload, analytics, CDN, or third-party font request |
| Offline / update | Existing exact browser service-worker regression, desktop + mobile | PASS — old controlled release updated, stale cache removed, and the new shell reloaded offline |
| Response policy | Unit assertion of `public/staticwebapp.config.json` | PASS — CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, and `connect-src` allowlist are present |
| Bundle budget | production build | PASS — JS 34,705 B raw / 13,631 B gzip; CSS 18,362 B raw / 4,994 B gzip; mobile hero 12,450 B |
| Lighthouse mobile | local production preview, Chromium 1208 | PASS — Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.4 s, TBT 100 ms, CLS 0 |

## Deploy / post-deploy

Deploy `dist/` with `/opt/fleet/lib/deploy-static.sh rehearsal-sightline dist`. After deployment, verify the live bytes, CSP/frame protection, URL-return path, and service-worker offline reload at `https://rehearsal-sightline.sociobot.in/`; append the exact live evidence here.

## Known gaps / next steps

- The sightline remains a compact rehearsal cue, not full score engraving or synthesized playback. Confirm articulation, dynamics, and layout against the source part.
- V1 supports partwise MusicXML. Re-export timewise MusicXML as partwise. PDF/OCR, collaboration, and score distribution are intentional non-goals.
- The browser retains one active plan locally; JSON backup is the portable archival path.
