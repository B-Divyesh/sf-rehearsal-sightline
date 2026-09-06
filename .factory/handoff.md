# Rehearsal Sightline — review 1 handoff

## Status: FAIL

Review 1 found 7 findings and 18 untested public claim groups. The implementation candidate is `58d512eb3841a29264796f09c75b6f8b7b3c33d4`; the documentation base reviewed is `ff8d919a66249dbf7b2a7a830ed6ff0b69368d29`. The two later commits after the implementation candidate are report-only, and production matches the clean candidate build.

No product code was changed in this work order. The full evidence and remediation details are in [review-1.md](review-1.md).

## Main findings

- There is no one-click sample, demo banner, reset, real-data exit, separate demo storage, or `.factory/demo.md`.
- The live “Buy Studio securely” action returns HTTP 404.
- `.factory/claims.json` and `@claim:` tests are absent; 18 public claim groups remain untested under the claims contract.
- Route-specific titles, focus management, a real designed 404, social metadata, and the apple-touch icon are missing.
- The first screen and landing structure do not fully meet the plain-words and standard-skeleton requirements.
- The Privacy and Terms pages do not provide a privacy-request route for purchase/license data.

## Verified working

The free MusicXML workflow works on desktop and at 390 × 844: import, part selection, look-ahead, range creation, notes, statuses, persistence, JSON export, print, delete/Undo, clearing, invalid/boundary recovery, keyboard commands, and offline reload. Fresh Axe checks found no violations. All populated phone controls met 44 × 44 CSS px, reduced motion was honored, and the page had no horizontal overflow.

Every earlier verification defect is resolved: service-worker update behavior and reproducibility, immediate result feedback, invalid-license feedback, focus contrast, CSP/framing headers, selected-part visibility, and mobile touch sizes.

## How to reproduce

From a clean checkout:

```sh
npm ci
npm test
npm run build
npm run test:e2e
/opt/fleet/lib/verify-url.sh https://rehearsal-sightline.sociobot.in /tmp/rehearsal-sightline-smoke
```

The commands pass with 9 unit tests and 18 browser tests. `dist/` is produced. Lighthouse mobile measured 98 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO. JavaScript is 13,631 bytes gzip and CSS is 4,997 bytes gzip.

To reproduce the release blockers, open `/demo` in a fresh context and observe the empty import screen, follow “Buy Studio securely” and observe HTTP 404, and check that `.factory/claims.json` does not exist.

## Next steps

Implement the demo and demo-only storage, add complete claim declarations/tests, repair checkout, and then address routing, metadata, landing copy/structure, and privacy-request instructions. Run a new independent review after deployment. Do not mark the product PASS until the finding count and untested claim count are both zero.
