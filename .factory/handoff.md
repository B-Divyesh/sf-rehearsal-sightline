# Rehearsal Sightline — repair handoff

## Status: ready for deployment verification

**Repair base:** `2f00889de86919dfe82bedada80fd6de01903e11`

**Failed candidate repaired:** `2192fcc0f4f9cf6a89507be617168b13f5c62123`
**Work order:** `rehearsal-sightline-repair-4`

## Repair made

The two release-blocking 390 px findings in `.factory/verification-4.md` are repaired without changing the researched local-first MusicXML workflow:

- The Part picker now owns a full mobile action row, so the selected instrument remains visible instead of collapsing beside Print and More.
- Native range controls retain a slim visual track inside a 44 px-high input target. Short legal/footer links now have a minimum 44 × 44 px target; the range-card status selector and Undo button meet the same rule.
- `tests/app.spec.ts` adds an exact 390 × 844 regression: it imports the two-part fixture, asserts the selected `Clarinet in B♭` part picker is at least 300 × 44 px, adds a queue item, then audits every rendered `a`, `button`, `input`, `select`, `textarea`, and `summary` for a minimum 44 × 44 px rectangle. It passes in both configured browser projects.

## Local verification (2026-08-28)

| Check | Result |
| --- | --- |
| Clean install | `npm ci` — 99 packages, 0 vulnerabilities |
| Unit/integration | `npm test` — 5 files, 9 tests passed |
| Type check / build | `npm run build` — `tsc --noEmit` and Vite production build passed; `dist/index.html` exists |
| Browser integration | `npm run test:e2e` — 18/18 passed across desktop and 390 × 844 mobile, including MusicXML import, persistence, keyboard path, Axe serious/critical scans, license recovery, reduced-motion behavior, service-worker replacement/offline reload, and the new mobile target audit |
| Local production smoke | `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 <temp-dir>` — title, `lang=en`, one h1, main, image alt text, labelled buttons, and no browser console/page errors |
| Lighthouse mobile | 97 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.3 s, TBT 200 ms, CLS 0 |
| Built budgets | JS 34,705 B raw / 13.73 KB gzip; CSS 18,450 B raw / 4.99 KB gzip; mobile hero 12,450 B |

There is no `lint` script in this intentionally small Vite/TypeScript project; the build runs the available TypeScript type check. The production response policy remains in `public/staticwebapp.config.json`, and the existing response-policy unit test passes.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run preview
```

At 390 × 844, import `tests/fixtures/rehearsal.musicxml`. The Part picker displays “Clarinet in B♭”; both range sliders and all rendered controls have 44 × 44 px or larger target rectangles. The service-worker suite exercises an old controlled release, a replacement release, stale-cache cleanup, and offline reload.

## Deployment

Static Azure deployment and live identity/header verification are the final work-order steps. This handoff will be updated with the deployed URL and exact post-deploy evidence once they complete.

## Known gaps

None in the product repair. No score data is sent off-device in the free workflow; the only optional external call remains the documented Sociobot license verification endpoint.
