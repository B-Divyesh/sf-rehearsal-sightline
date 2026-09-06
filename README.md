# Rehearsal Sightline

Plan MusicXML rehearsal slices with a look-ahead view. It is for orchestra and band players who want to see the next measures before they arrive.

Try the complete isolated sample: [rehearsal-sightline.sociobot.in/demo](https://rehearsal-sightline.sociobot.in/demo).

## First step

Choose **Try it with sample data** to open four marked rehearsal slices. The demo uses its own browser-storage key. It never reads or changes an imported score plan.

For your own score, import a MusicXML, XML, or MXL file up to 25 MB. The free planner lets you choose a part, set an eight-measure sightline, mark ranges with notes and results, print a cue sheet, and export or import a plan backup.

Scores stay in your browser during free use. No analytics, ads, third-party fonts, or score uploads are used. After the first visit, the demo and free workspace work offline.

## Studio status

Studio is planned as a US$12 one-time license. It will add a 16-measure sightline and target-tempo cues. Checkout is not available until Sociobot billing registration is complete, so the product does not send visitors to a broken payment page. An existing license can still be restored and checked through the Sociobot billing API. The free planner, cue-sheet printing, and backup export remain available without Studio.

## Run locally

Requires Node.js 20 or newer.

~~~sh
npm ci
npm run dev
~~~

Open the URL printed by Vite. Use /demo for the one-click sample.

Keyboard controls work while focus is not in a form field:

- Space: start or pause the rehearsal clock
- Left / Right: move one measure
- Shift + Left / Right: move four measures
- L: add the visible passage to the queue

## Test and build

~~~sh
npm ci
npm test
npm run build
npm run test:e2e
~~~

The production build is written to dist/ with dist/index.html at its root. Install the pinned browser once if a clean machine does not already have it:

~~~sh
npx playwright install chromium
~~~

Every public product claim is declared in [.factory/claims.json](.factory/claims.json). Run the complete claim suite with:

~~~sh
npm run test:claims
~~~

Each manifest entry also gives the exact clean command for that individual claim. The Playwright suite covers desktop and a 390 px phone viewport.

Preview the production build:

~~~sh
npm run preview
~~~

Azure Static Web Apps uses public/staticwebapp.config.json for response headers, caching, and the designed 404 response. Deployment, DNS, and billing registration are handled outside this repository.

## Data and limits

The active plan is stored in browser localStorage. Demo data uses a separate demo: storage namespace. The app accepts partwise MusicXML. Re-export timewise MusicXML as partwise before importing.

Rehearsal Sightline does not scan PDFs, host scores, share notation, synthesize audio, or replace engraved parts. Read [Privacy](https://rehearsal-sightline.sociobot.in/privacy), [Terms](https://rehearsal-sightline.sociobot.in/terms), and [purchase data requests](https://rehearsal-sightline.sociobot.in/privacy-request).

See [.factory/design.md](.factory/design.md) for the visual system and asset provenance, and [.factory/demo.md](.factory/demo.md) for the sample sandbox.

## License

MIT — see [LICENSE](LICENSE).
