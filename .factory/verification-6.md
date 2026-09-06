# Plan MusicXML rehearsal slices — independent verification 6

**Verdict: FAIL**

**Finding count:** 1  
**Untested claim count:** 5  
**Verified:** 2026-09-06 UTC  
**Live URL:** <https://rehearsal-sightline.sociobot.in>  
**Implementation candidate:** `cab4a8f0cc707d6579137f7863f497dec2cc2cfa`  
**Documentation base:** `da11c6f54d0a8284eb050b7c0713a00771e7000b`

Commits `0696281` and `da11c6f` change only `.factory/handoff.md` after the implementation candidate. All 18 public build files from a clean `cab4a8f` build match the live bytes.

## Job, audience, and first action

- **Job:** Turn a MusicXML score into manageable rehearsal slices with a view of the next measures.
- **Audience:** Orchestra and band players practicing from their own MusicXML scores.
- **First action before scrolling:** “Try it with sample data.” The same first screen also offers MusicXML import.

Fresh 1440 × 900 desktop and 390 × 844 phone contexts showed the job, audience, sample action, and three privacy/offline/price facts before scrolling. Evidence: `/work/.evidence/verification-6/live-desktop-first-screen.png` and `/work/.evidence/verification-6/live-phone-first-screen.png`.

## Finding

### P1 — Five public claims lack complete tagged outcome tests

The 15 manifest entries each have exactly one tag, and every declared command passes on desktop and phone. The manifest is still incomplete, and one tagged Studio test checks controls rather than the promised results.

| Untested public claim | Public evidence | Why the tagged suite is incomplete |
| --- | --- | --- |
| Space starts or pauses the rehearsal clock, and `L` adds the visible passage | `README.md:30-35` | `@claim:keyboard-stepping` sends only ArrowRight and Shift+ArrowRight. Space and `L` have no declared claim outcome. |
| Studio is a US$12 one-time purchase with no subscription | Landing Studio section, Terms, `README.md:17` | No manifest claim or tagged assertion checks the stated price or purchase model. |
| Studio shows a 16-measure sightline | Landing Studio section and `README.md:17` | `@claim:studio-license` checks only `max="16"` on the range input. It never sets 16 or requires 16 rendered measure tiles. |
| Studio adds target-tempo cues to the queue and printed cue sheet | Landing Studio section and `README.md:17` | `@claim:studio-license` checks only that the tempo input is enabled. It never saves a tempo or checks the queue and print output. |
| Sociobot/Dodo handles checkout, receipts, taxes, refunds, and refund revocation | Landing, Terms, Privacy, and Privacy request | No manifest entry or recorded outcome tests this promise. Checkout is deliberately unavailable while registration is pending. |

This violates the supplied claims contract: public claims must be declared and proven by tagged observable outcomes. Passing a test that only exposes a control is not proof that its promised output works. Until these statements are removed or fully declared and tested, `untested_claim_count` is 5 and the release cannot pass.

## Declared claim commands

Every command below ran separately from a clean detached checkout at `cab4a8f`, after `npm ci`. Each ran the one matching test in both configured projects.

| Claim ID | Result |
| --- | --- |
| `demo-sandbox` | PASS — 2/2 |
| `musicxml-import` | PASS — 2/2 |
| `local-privacy` | PASS — 2/2 |
| `part-choice` | PASS — 2/2 |
| `lookahead` | PASS — 2/2 |
| `keyboard-stepping` | PASS — 2/2 |
| `range-notes` | PASS — 2/2 |
| `print-cue-sheet` | PASS — 2/2 |
| `plan-backup` | PASS — 2/2 |
| `browser-restore` | PASS — 2/2 |
| `offline-reload` | PASS — 2/2 |
| `free-core` | PASS — 2/2 |
| `studio-license` | PASS — 2/2, but incomplete for the separate 16-measure and tempo-output claims above |
| `license-cache` | PASS — 2/2 |
| `studio-pending` | PASS — 2/2 |

The additional aggregate claim run passed 30/30 in 39.4 seconds. Machine-readable output: `/work/.evidence/verification-6/claim-results.json`.

## Demo and live workflow

The live `/demo` path passes the sandbox contract on desktop and phone:

- It opens “North Window Study” for Clarinet in B♭ with eight measures and four realistic slices: Opening shape, Rehearsal A lift, Rest before the turn, and Return figure.
- The sticky “Demo — sample data, nothing is saved” label remains visible after scrolling.
- Adding a fifth slice works. Reset demo restores the original four.
- A pre-existing real-plan storage value remains byte-for-byte unchanged during demo use and after reset.
- Start for real removes the demo session, returns to `/`, and preserves the real-plan value.
- Demo license tests use the `demo:` namespace and leave the real license key empty.

Evidence: `/work/.evidence/verification-6/live-browser-results.json`, `live-desktop-demo.png`, and `live-phone-demo.png`.

The real live workflow also passed representative normal, invalid, boundary, and recovery paths. A malformed XML error recovered with a valid import. A reversed 5 → 2 range was rejected, a corrected 5 → 5 range saved, its note and Passed result survived reload, the backup exported as `rehearsal-sightline/v1`, and print media showed the saved cue. The complete local browser suite also covers MXL, a 25 MiB + 1 byte rejection, invalid backup recovery, delete/Undo, and score replacement confirmation.

## Accessibility, phone, keyboard, and routes

- Live Playwright Axe scans found **zero violations** on the phone landing page, phone demo, and populated desktop workspace.
- `/opt/fleet/lib/verify-url.sh` passed in 672 ms: correct title and `lang`, one h1, one main, no missing alt text, no unlabeled buttons, and no unexpected console errors.
- The phone view has no page overflow. Its part picker is 366 × 44 px, shows Clarinet in B♭, and the complete rendered-control audit found no target below 44 × 44 px.
- Tab reaches the visible skip link. Activating it bypasses the header, and the next Tab reaches the first main action. Client navigation updates the title, announces the route, focuses the new h1, and restores focus on Back.
- Reduced motion changes the tested transition to `0.00001s`. Keyboard measure stepping works without a trap.
- `/`, `/demo`, `/privacy`, `/terms`, and `/privacy-request` return 200 with route-specific titles, canonical links, one h1, and one main.
- `/verification-6-missing-page` deliberately returns HTTP 404 and shows the designed “Page not found” page with a working return link. Its expected browser 404 notice is not a product error.
- Every rendered internal and external link returned below 400. Legal and privacy-request links work directly.

## Privacy, offline use, performance, and deployment

- The imported-score live flow made only same-origin requests for HTML, hashed JS/CSS, and the original hero asset. No score request, analytics, advertising, CDN script, or external font request was observed.
- A fresh live `/demo` became service-worker controlled, cached the shell, and reloaded its populated workspace offline. The local old-client/new-release regression also passed.
- Live headers include HSTS, `nosniff`, strict-origin referrer policy, restrictive Permissions-Policy, CSP with Sociobot as the only external connection origin, `frame-ancestors 'none'`, and `X-Frame-Options: DENY`.
- HTML revalidates after 30 seconds; hashed assets are immutable for one year; `sw.js` is `no-cache`.
- Lighthouse 13 mobile: **99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO**; FCP 1.05 s, LCP 1.26 s, TBT 107 ms, CLS 0. Evidence: `/work/.evidence/verification-6/lighthouse.report.html` and `.json`.
- Clean build: JS 44,860 bytes raw / 16.33 KB gzip; CSS 20,906 bytes raw / 5.48 KB gzip; mobile hero 12,450 bytes; no downloaded fonts.
- All 18 public files match the clean candidate byte-for-byte, including route HTML, JS, CSS, images, manifest, icons, robots, sitemap, and deterministic service worker.

This is a static browser product. Backend tenant, restart, health, 429/Retry-After, CLI, library-consumer, and desktop-installed-artifact checks do not apply. The deterministic MusicXML workflow does not need an AI-assisted step.

## Clean quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 99 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 11/11 |
| `npm run build` | PASS — TypeScript and Vite; `dist/` produced |
| `npm run test:e2e` | PASS — 54/54 across desktop and 390 px phone |
| 15 individual manifest commands | PASS — 30/30 configured project runs |
| Live Axe | PASS — 0 violations in all scanned states |
| Live smoke | PASS |
| Live Lighthouse mobile | PASS — 99 Performance / 100 Accessibility |
| Candidate/live byte identity | PASS — 18/18 public files |

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Fixed service-worker cache could keep an old shell | RESOLVED — update and offline regression passes. |
| Result stamp and count stayed stale | RESOLVED — tagged range test and full suite pass. |
| Invalid returned license stayed on “Verifying” | RESOLVED — full suite passes the completed invalid result. |
| Focus indicator contrast was below 3:1 | RESOLVED — configured contrast test passes. |
| CSP and framing policy were missing | RESOLVED — live headers contain both. |
| Service worker was not reproducible | RESOLVED — clean and live worker bytes match. |
| Phone part picker hid the instrument | RESOLVED — 366 × 44 px with visible value. |
| Phone controls were below 44 × 44 px | RESOLVED — none found. |
| One-click isolated sample was missing | RESOLVED — live demo, reset, exit, and storage separation pass. |
| Studio checkout link returned 404 | RESOLVED — no checkout link or request is exposed while registration is pending. |
| Claims had no manifest or tagged tests | PARTLY RESOLVED — 15 declared commands pass, but five public claims remain missing or incomplete as the open finding. |
| Routes, titles, focus, and 404 were incomplete | RESOLVED — all direct and client routes pass. |
| Social and device metadata was missing | RESOLVED — live candidate contains OG, Twitter, social image, favicon, and apple-touch metadata. |
| First screen and landing structure were incomplete | RESOLVED — job, audience, action, facts, steps, limits, Studio, and footer are present. |
| Privacy page lacked a purchase-data request path | RESOLVED — `/privacy-request` works and is linked from Privacy and Terms. |

## Required next work

Declare and add outcome tests for the five claims above, or remove/limit the public statements until they can be proven. For Studio, use a recorded valid license response, a sample with at least 16 measures, a saved target tempo, and print-media assertions. Re-run every manifest command and this independent review. Do not mark PASS while any public claim remains untested.
