# Independent verification 4 — FAIL

**Work order:** `rehearsal-sightline-verify-4`
**Candidate commit:** `2192fcc0f4f9cf6a89507be617168b13f5c62123`
**Live URL:** <https://rehearsal-sightline.sociobot.in/>
**Verified:** 2026-08-28

## Verdict

**FAIL for release acceptance.** The candidate is buildable, its complete public artifact is deployed byte-for-byte, and the core local MusicXML workflow works on desktop and mobile. The previous service-worker identity failure is fixed.

Two P2 mobile interaction defects remain. At the required 390 px viewport, the selected-part control collapses to a 42 px-wide, unlabeled-looking arrow field, so a player cannot see the currently selected instrument. Several interactive controls, including footer legal links and both range sliders, have rendered hit areas below the required 44 × 44 CSS px. This does not meet the supplied mobile clarity/touch-target acceptance criteria.

## Defects

### P2 — 390 px part picker hides the selected instrument

After importing the representative two-part MusicXML fixture at 390 × 844, the visible `Part` `<select>` renders at **42 × 44 px**. Its selected value (for example, “Clarinet in B♭”) is completely clipped; only the native dropdown arrow is visible. This prevents the player from confirming which part the rehearsal queue represents, which is core context for this product.

### P2 — Interactive touch targets below 44 × 44 px at 390 px

Independent computed-layout inspection on the populated live workspace found these visible controls below the contract minimum:

| Control | Rendered size |
| --- | ---: |
| Current-measure range input | 330 × 24 px |
| Look-ahead range input | 330 × 24 px |
| Header wordmark/home link | 167 × 31 px |
| Studio Terms / Privacy links | 30 × 12 px / 36 × 12 px |
| Footer Privacy / Terms / Source links | 50 × 22 px / 41 × 22 px / 47 × 22 px |

The target audit was performed against the deployed site after importing the fixture, not inferred from source. Lighthouse’s heuristic touch-target audit passes, but the stated factory contract is the stricter explicit 44 × 44 px requirement.

## Quality gates and evidence

All commands were run from a clean checkout at the candidate SHA. No product code was changed during verification.

| Check | Fresh evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci` | PASS — 99 packages installed; 0 vulnerabilities |
| Unit/integration | `npm test` | PASS — 5 files, 9 tests |
| Type check and exact production build | `npm run build` | PASS — `tsc --noEmit`, Vite production build, `dist/` created |
| Available lint | `package.json` provides no lint script | N/A |
| Browser integration | `npm run test:e2e` | PASS — 16/16 desktop and 390 × 844 tests, including axe and service-worker update/offline regression |
| Independent live smoke | `/opt/fleet/lib/verify-url.sh <url> <temp-dir>` | PASS — 684 ms; title, `lang=en`, one h1, main, image alt text, labelled buttons, no console/page errors |
| Independent Axe serious/critical | Live empty, populated desktop, and populated 390 px scans | PASS — none |
| Reduced motion / overflow | Live populated 390 px workspace | PASS — document width 390 px; range-card transition `0.00001s` under reduced motion |
| Lighthouse mobile, live | Lighthouse 13.4.1, simulated mobile (`--disable-gpu --disable-dev-shm-usage`) | PASS — Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 60 ms, CLS 0 |
| Bundle budget | Fresh `dist/` | PASS — JS 34,705 B raw / 13.73 KB gzip; CSS 18,362 B raw / 4.99 KB gzip; mobile hero 12,450 B; no downloaded fonts |

## Product exercise

On the live production deployment, using the representative partwise MusicXML fixture:

- Imported the score locally; created four named rehearsal ranges plus a fifth by keyboard (`ArrowRight`, `Shift+ArrowRight`, `L`); added a player note; set Needs work and Passed statuses; reloaded and verified all five ranges, status counts, and note persisted.
- Verified print media exposes a cue sheet with all five range rows; exported and parsed `north-window-study-sightline.json` (`rehearsal-sightline/v1`); and confirmed delete-confirm/Undo restores a range. The repository browser suite's 16 tests also passed fresh.
- Exercised recovery: malformed XML reported “This file is not valid XML…”, timewise XML reported the actionable partwise re-export instruction, an inverted 5 → 2 measure selection reported “Choose an end measure at or after 5.”, a corrected range was saved, invalid JSON backup reported its actionable error, and the workspace remained usable. A fresh 25 MiB + 1 B upload reported the documented over-25-MB error.
- Keyboard-only score commands were exercised on the reading surface. The Print cue sheet button had a visible focus-visible outline and measured 48 px high. No console or page errors occurred in the independent normal or PWA flows.

## Privacy, PWA, policies, and deployment identity

- In the normal imported-score workflow, browser requests were only to `https://rehearsal-sightline.sociobot.in`; the only local storage key was `rehearsal-sightline:session:v1`. No score upload, analytics, CDN script, third-party font, or advertising request was observed.
- A fresh `?license=qa-invalid-token` visit made the documented additional request only to `https://api.sociobot.in`, removed the token from the visible URL, saved it locally, and displayed the invalid-license recovery message. This is consistent with the documented paid restore flow.
- The live worker registered at `/sw.js`, controlled the mobile page, and reloaded offline with the h1 rendered and no errors. The fresh repository PWA update regression passed, including stale-cache removal and an offline reload of a replacement release.
- Live response policies: HTTPS/HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive Permissions-Policy, CSP with `default-src 'self'`, Sociobot-only `connect-src`, `frame-ancestors 'none'`, and `X-Frame-Options: DENY`. HTML is `public, must-revalidate, max-age=30`; hashed JS/CSS are immutable for one year; `/sw.js` is `no-cache`.
- The deployment-only failure in verification 3 is **resolved**. Two consecutive local builds produced the same `sw.js` SHA-256: `33188b157c26076ad28a00786b418798e405f3783a2d5fffac626831b51d213a`. Every publicly served candidate file matched the fresh `dist/` bytes: index, JS, CSS, both hero images, manifest, mark, robots, sitemap, and service worker. `staticwebapp.config.json` is deployment configuration rather than a public artifact; its policy is corroborated by the live headers and response-policy test.

## Required follow-up

Before release acceptance, make the selected part name visible at 390 px and give all mobile interactive controls a practical 44 × 44 px hit target (the slider track may remain visually thin inside such a target). Re-run the 390 px layout/target audit and the existing full suite. No deployment repair is required.
