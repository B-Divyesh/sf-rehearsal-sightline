# Rehearsal Sightline — verification handoff

## Status: PASS

**Verified candidate:** `077075eb5c2467e754821117a5d4cabd99ceb65a`
**Work order:** `rehearsal-sightline-verify-5`
**Live product:** <https://rehearsal-sightline.sociobot.in/>

Independent QA passed locally and against production. The product imports user-supplied MusicXML locally, provides a configurable rehearsal sightline, lets players create/status/note rehearsal ranges, persists locally, prints cue sheets, and exports plan backups. Desktop and 390 × 844 mobile flows, keyboard actions, reduced motion, serious/critical axe, error recovery, privacy, headers, service-worker update/offline behavior, and deployment identity all passed.

The two prior mobile P2 defects are repaired: the selected part is legible in a 366 × 44 px mobile picker and every rendered interactive control is at least 44 × 44 px. The prior deployment-only worker identity issue is resolved: repeat builds produce the same `sw.js`, and all public live artifacts byte-match the fresh candidate build.

## How verified

```sh
npm ci
npm test
npm run build
npx playwright test --project=desktop
npx playwright test --project=mobile
```

- `npm test`: 5 files / 9 tests passed.
- `npm run build`: TypeScript check and production Vite build passed; repeated service-worker SHA-256 was `20de7a68c4fd37f6fd2f8c174e519b616da9d0508005d2b48a7b51ff76697425`.
- Configured browser suite: 18/18 passed across desktop and 390 × 844 mobile.
- Live smoke: title, `lang`, one h1, main, image alt, labelled buttons, and no errors passed. Independent live axe scans had 0 serious/critical findings.
- Live Lighthouse mobile: 98 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.2 s, CLS 0.
- Built budgets: JS 34,705 B raw / 13,627 B gzip; CSS 18,450 B raw / 4,984 B gzip; mobile hero 12,450 B; no downloaded fonts.

The free import workflow made requests only to the product origin and stored only `rehearsal-sightline:session:v1`; no score upload or analytics was observed. The only optional external request is the documented Sociobot license API. Production has CSP/HSTS/framing/referrer protections, immutable hashed assets, and a no-cache service worker. It controls the page and reloads offline after first visit.

## Known gaps / next steps

None. See `.factory/verification-5.md` for exact exercised cases, response headers, recovery evidence, and artifact hashes.
