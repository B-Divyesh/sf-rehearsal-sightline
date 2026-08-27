# Rehearsal Sightline — verification handoff

## Status: FAIL

Independent verification of candidate `8e34bff1f8e3580e39b30230761fe5112175a31f` against https://rehearsal-sightline.sociobot.in/ **failed** on 2026-08-27.

The core local-first MusicXML rehearsal workflow, production build, unit tests, desktop/mobile Playwright suite, axe checks, bundle budget, privacy behavior, and live deployment match all passed. The live HTML, JS, and service-worker bytes match this candidate exactly.

The release blocker is the PWA update path: `public/sw.js` uses a permanent `sightline-v1` cache, precaches `index.html`, and serves it cache-first. Existing controlled clients can therefore remain pinned to an old shell after a deploy. The worker must receive a build-specific cache revision (or network-refresh navigations) and the old-client → updated-build → offline-reload scenario must pass before release.

See [.factory/verification.md](verification.md) for exact commands, measurements, reproduction, headers, privacy/network evidence, and the required remediation.

## Run / reverify

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Deployment output is `dist/`. After the PWA remediation, verify an already-controlled client receives a changed release and still reloads offline.
