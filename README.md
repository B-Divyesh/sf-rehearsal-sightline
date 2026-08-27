# Rehearsal Sightline

Rehearsal Sightline turns a player’s own MusicXML score into a deliberately sized rehearsal queue. It is for orchestra and band players who need to see what comes next, choose playable passages, and remember why a passage stopped.

Live product: [rehearsal-sightline.sociobot.in](https://rehearsal-sightline.sociobot.in)

## What it does

- Opens `.musicxml`, `.xml`, and compressed `.mxl` files locally (up to 25 MB).
- Lets the player choose a score part and move through a notation sightline.
- Runs a tempo-aware rehearsal clock or steps measure by measure.
- Marks ranges with a name, player note, and planned / needs work / passed result.
- Prints a clean cue sheet and exports a portable JSON plan backup.
- Restores the latest plan from browser storage and works offline after first load.
- Offers an optional US$12 one-time Studio license for a 16-measure sightline and target-tempo cues. Core planning and export stay free.

No score is uploaded. The app has no analytics, advertising, CDN scripts, or third-party fonts.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the local URL shown by Vite and import your own MusicXML file. A small original test score is available at `tests/fixtures/rehearsal.musicxml` for development only.

Keyboard controls (when focus is not in a form field):

- `Space`: start or pause the rehearsal clock
- `Left` / `Right`: move one measure
- `Shift` + `Left` / `Right`: move four measures
- `L`: add the visible passage to the queue

## Test and build

```sh
npm test
npm run build
npm run test:e2e
```

`npm run build` is the deployment command. It creates `dist/` with `dist/index.html` at the root. The Playwright suite runs on desktop and a 390 px mobile viewport and includes axe accessibility checks. Install its browser once with `npx playwright install chromium` if needed.

Preview the production build with:

```sh
npm run preview
```

Azure Static Web Apps reads `public/staticwebapp.config.json` for SPA fallback, security headers, and asset caching. Deployment, DNS, product registration, and billing configuration are handled outside this repository.

## Data, billing, and limitations

The active parsed score and rehearsal plan are saved in `localStorage`. The Privacy and Terms pages are available at `/privacy` and `/terms`. Checkout and license verification use only the Sociobot billing API; no payment provider is embedded here.

The sightline is a compact pitch-and-rest preview for rehearsal navigation, not a replacement for engraved notation. V1 accepts partwise MusicXML; timewise MusicXML should be re-exported as partwise. It does not synthesize audio, OCR PDFs, collaborate, or distribute notation.

See [.factory/design.md](.factory/design.md) for the product-specific visual system and generated-image provenance, and [.factory/handoff.md](.factory/handoff.md) for verification results.

## License

MIT — see [LICENSE](LICENSE).
