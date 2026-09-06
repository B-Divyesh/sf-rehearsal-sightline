# Demo sandbox

## Open the sample

Visit /demo or choose **Try it with sample data** on the landing page. The sample opens the original eight-measure “North Window Study” for Clarinet in B♭ with four marked ranges, notes, and results.

The landing action links to /demo#workspace, so the first view after clicking is the populated rehearsal workspace.

## Storage isolation

The real workspace uses rehearsal-sightline:session:v1. The demo uses only demo:rehearsal-sightline:session:v1. Demo licenses use the same demo: prefix. While the demo banner is shown, the app does not read or write the real plan or license keys.

## Reset and leave

**Reset demo** replaces the demo namespace with the original four sample ranges. **Start for real** deletes the demo namespace, returns to /, and leaves real browser data unchanged.

The @claim:demo-sandbox browser test checks this separation. The @claim:offline-reload test opens /demo in a dedicated browser context and reloads the populated sample offline after the service worker controls the page.
