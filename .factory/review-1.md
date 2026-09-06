# Review 1 — Plan MusicXML rehearsal slices with a look-ahead view

**Verdict: FAIL**

**Finding count:** 7  
**Untested claim count:** 18  
**Reviewed:** 2026-09-06 UTC  
**Live URL:** <https://rehearsal-sightline.sociobot.in>  
**Implementation candidate:** `58d512eb3841a29264796f09c75b6f8b7b3c33d4`  
**Documentation base:** `ff8d919a66249dbf7b2a7a830ed6ff0b69368d29`

Commits `077075e` and `ff8d919` change only reports after the implementation candidate. A fresh build at the documentation base has no product-file difference from `58d512e`, and its public files match production byte for byte.

## Job, audience, and first action

- **Job:** Turn a player’s MusicXML score into a look-ahead view and a queue of manageable rehearsal ranges.
- **Audience:** Orchestra and band players practicing from their own MusicXML scores.
- **First action shown before scrolling:** “Import MusicXML.” The required “Try it with sample data” action is absent.

## Findings

### 1. P1 — The required one-click sample does not exist

Fresh desktop and 390 × 844 phone contexts show only score import. `/demo` returns the same empty landing page. It does not load a populated score, show “Demo — sample data, nothing is saved,” offer “Reset demo” or “Start for real,” or use a separate demo storage namespace. `.factory/demo.md` is also absent.

This blocks the required no-setup evaluation and makes the sample isolation/reset contract impossible to verify. All review edits used disposable browser contexts; no existing browser profile or user data was read or changed.

### 2. P1 — The live Studio purchase action is broken

The visible “Buy Studio securely” link requests `https://api.sociobot.in/api/v1/products/rehearsal-sightline/checkout`. A fresh browser request and `curl` both receive HTTP 404 with the API error `enabled factory product`; no checkout opens. This is an unexpected error in a paid user path, not the deliberate product-site 404 check.

### 3. P1 — Public claims have no claim manifest or tagged tests

`.factory/claims.json` is absent and `rg '@claim:'` finds no tests. There are therefore no declared claim commands to run from the demo sandbox. Eighteen distinct public claim groups have no required manifest entry or exactly-one tagged test:

1. `.musicxml`, `.xml`, and compressed `.mxl` import up to 25 MB.
2. Score processing stays in the browser and the free flow uploads no score.
3. No analytics, ads, fingerprinting, CDN scripts, or third-party fonts run.
4. Players can choose a score part.
5. The app renders a configurable look-ahead sightline.
6. The rehearsal clock is tempo-aware and supports measure stepping.
7. Free users can create unlimited named ranges with notes and results.
8. The app prints a populated cue sheet.
9. The app exports and imports a portable JSON plan backup.
10. The latest plan is restored from local storage, and clearing site data removes it.
11. The app works offline after the first visit and keeps the free workspace available.
12. Studio costs US$12 once and creates no subscription.
13. Studio increases the sightline to 16 measures.
14. Studio adds target-tempo cues to ranges and cue sheets.
15. A Studio license can be restored on another device.
16. License verification is cached for at most one day.
17. Core planning, export, accessibility, and safety behavior remain free.
18. Sociobot/Dodo handles checkout, receipts, taxes, and refunds, and a refund revokes the license.

Some generic tests and this review incidentally exercise parts of these statements. They do not satisfy the claims contract because they are not declared, tagged, or run from a clean demo entry point. Claim 18 is also currently false at its first step because checkout returns 404.

### 4. P2 — Real routes, titles, focus, and the 404 page are incomplete

- `/privacy`, `/terms`, `/demo`, and an unknown route all keep the home title, `Rehearsal Sightline — see what comes next`.
- The canonical URL and description also stay set to the home route.
- `/not-a-real-route` and `/404.html` return HTTP 200 and render the normal landing page. There is no designed 404 response or route.
- Navigation uses full document loads rather than the required History API behavior. After returning from Privacy, focus is on `<body>`, not the new `<h1>`, and no route change is announced.
- `sitemap.xml` does not list the required demo route.

### 5. P2 — Required social and device metadata is missing

The live document has no Open Graph title, description, or 1200 × 630 product image; no Twitter card metadata; and no 180 px apple-touch icon. The SVG favicon, manifest, theme color, description, and home canonical link are present.

### 6. P2 — The first screen and landing structure do not meet the plain-words contract

The first screen does not name orchestra or band players and does not present three short facts for privacy, offline use, and price. The landing page has no three-step “How it works” section and no plain “What it does not do” or privacy section before pricing. The mobile header hides every navigation link. The footer omits “Built by Param Factory” and a version/build identifier.

Several headings use mood or metaphor instead of naming their sections, including “Your rehearsal room,” “A longer view for deeper rehearsals,” and “Privacy, without a backstage.” The page title’s “see what comes next” does not name MusicXML rehearsal planning. The required `.factory/copy-audit.md` is absent.

### 7. P3 — The privacy page gives no privacy-request route

The Privacy page explains local storage and clearing site data, but it provides no contact, link, or instructions for a person who wants to ask about purchase/license data processed by the named merchant. The Terms page also names the merchant without linking to a request or support route.

## Live product checks

| Area | Result | Evidence |
| --- | --- | --- |
| Fresh desktop and phone first screen | FAIL | No sample action; the real import action is visible; no console or page errors. |
| Required demo and reset | FAIL | `/demo` is the empty app; sample banner, reset, and real-data separation are absent. |
| Normal free workflow | PASS | Imported “North Window Study,” selected Clarinet in B♭, added ranges, stored a note, marked Passed, and restored the state after reload. Only `rehearsal-sightline:session:v1` was stored. |
| Invalid and recovery paths | PASS | Bad XML and a file over 25 MB show actionable errors; a later valid import succeeds. |
| Boundary paths | PASS | Range 5 → 2 is rejected; 5 → 5 saves. The keyboard Right arrow and `L` command work. |
| Export, print, delete, and reset | PASS | Exported `rehearsal-sightline/v1` JSON with two ranges; print media showed two rows; delete/Undo restored a range; cancel and confirm paths for removing a score behaved correctly. |
| Paid checkout | FAIL | The live checkout endpoint returns HTTP 404. |
| Invalid license recovery | PASS | A disposable invalid token is stripped from the URL and produces “License no longer active”; only the documented Sociobot verify request is added. |
| Keyboard and focus | PARTIAL | The first Tab reaches the visible skip link and workspace controls are keyboard-operable. Route-change focus fails as finding 4. |
| Accessibility | PASS with route exception | Playwright Axe reports no violations on fresh and populated desktop/phone states. Focus contrast tests pass. All visible populated-phone controls are at least 44 × 44 CSS px. |
| Mobile | PASS | At 390 px, the document has no horizontal page overflow; the part picker is 366 × 44 px and shows Clarinet in B♭. |
| Reduced motion | PASS | Range-card transition duration computes to `0.00001s`. |
| Privacy during free flow | PASS | Requests stay on the product origin; no score request, analytics, ad, CDN font, or third-party script is observed. |
| Offline and update | PASS | A controlled live page reloads offline. The old-client/new-release regression passes locally and removes the old cache. |
| Links | FAIL | Product, legal, source, and in-page links resolve; Studio checkout returns 404. |
| Legal pages | PARTIAL | Privacy and Terms render with one `<h1>` and `<main>`; titles and privacy-request handling fail as findings 4 and 7. |
| 404 design | FAIL | Unknown URLs return the landing page with HTTP 200. |
| Backend and installed artifact checks | N/A | This is a static browser product, not a backend, CLI, library, or desktop artifact. |
| Missed AI feature | No finding | Deterministic local MusicXML parsing and rehearsal planning do not need a model-assisted step. |

## Clean-checkout commands

All commands ran at `ff8d919` after `npm ci`; this tree contains the same product files as implementation commit `58d512e`.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 99 packages installed; 0 vulnerabilities. |
| `npm test` | PASS — 5 files, 9 tests. |
| `npm run build` | PASS — TypeScript and Vite; `dist/index.html` produced. |
| `npm run test:e2e` | PASS — 18/18 across desktop and 390 px mobile. |
| Claim commands | FAIL — no `.factory/claims.json`, no commands, and 18 untested claim groups. |
| `/opt/fleet/lib/verify-url.sh` | PASS — 632 ms, title/lang/one h1/main/alt/buttons/console checks. |
| Independent Playwright Axe | PASS — no violations on fresh or populated desktop/phone states. |
| Lighthouse mobile | PASS — Performance 98, Accessibility 100, Best Practices 100, SEO 100; FCP 1.7 s, LCP 2.2 s, TBT 0 ms, CLS 0. |

Built assets remain within budget: JavaScript is 34,705 bytes raw / 13,631 bytes gzip; CSS is 18,450 bytes raw / 4,997 bytes gzip; the mobile hero is 12,450 bytes. A second build produced the same service-worker SHA-256, `20de7a68c4fd37f6fd2f8c174e519b616da9d0508005d2b48a7b51ff76697425`.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Fixed cache name could keep an old shell | RESOLVED — update regression and live offline reload pass. |
| Result stamp/counter stayed stale | RESOLVED — live Passed state updates immediately and persists. |
| Invalid returned license stayed on “Verifying” | RESOLVED — live invalid-token notice completes correctly. |
| Focus outline contrast below 3:1 | RESOLVED — configured contrast checks pass against the live-matching CSS. |
| Missing CSP/framing policy | RESOLVED — live CSP, `frame-ancestors 'none'`, and `X-Frame-Options: DENY` are present. |
| Non-reproducible service worker / uncertain deployment identity | RESOLVED — repeat build hash is stable and all public artifacts match production. |
| Mobile part picker hid the selected instrument | RESOLVED — live picker is 366 × 44 px with the part name visible. |
| Mobile targets below 44 × 44 px | RESOLVED — no undersized visible control was found in the populated phone view. |

## Candidate and live identity

The clean build’s HTML, hashed JavaScript, hashed CSS, service worker, both hero images, manifest, mark, robots file, and sitemap match the live bytes. The implementation reviewed is therefore `58d512e`; the later documentation state is `ff8d919`.

## Required next work

Add the isolated one-click demo and its documentation first. Add and tag every public claim test, repair the live checkout registration/path, then complete route handling, metadata, landing copy/structure, and privacy-request instructions. Re-run every claim command and this full review. PASS requires zero findings and zero untested claims.
