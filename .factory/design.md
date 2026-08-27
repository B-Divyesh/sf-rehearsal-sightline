# Rehearsal Sightline — visual system

## Direction: glacial minimal ceramics

Sight-reading needs calm peripheral awareness, not another dense notation editor. The interface feels like a pale ceramic rehearsal room at blue hour: matte, tactile surfaces; fine graphite staff lines; a small cobalt cue that moves ahead of the player. Rounded forms reference handmade music stands and glazed score markers without becoming ornamental. The single-mode light treatment is deliberate: it keeps printed cues and the on-screen score visually continuous.

## Palette

- `ice-25` `#F7F9F8` — page field, an off-white glaze rather than pure white.
- `ice-100` `#E9EFED` — recessed tracks and quiet boundaries.
- `porcelain` `#FFFFFF` — working surfaces.
- `ink` `#172321` — primary copy and notation (13.9:1 on `ice-25`).
- `slate` `#4D5E5A` — secondary copy (6.5:1 on `ice-25`).
- `cobalt` `#2454A6` — actions and current sightline (6.4:1 with white).
- `deep-cobalt` `#173C7A` — hover/focus anchor.
- `lichen` `#2E6A55` — passed range/status.
- `ochre` `#8A5412` — needs-work status and warnings.
- `clay` `#A13D32` — errors/destructive action.

No gradients. Color always appears with a label, icon, position, or pattern.

## Type

- Display and editorial moments: Georgia, Cambria, `Times New Roman`, serif. Its calligraphic modulation quietly recalls printed parts.
- Interface and data: Inter-like native stack (`ui-sans-serif`, system UI, Segoe UI, sans-serif). No font download is required, improving privacy and first load.
- Scale: 14 / 16 / 18 / 24 / clamp(40–68) px. Body never drops below 16 px. Measure is capped near 68 characters. Measure numbers use tabular figures.

## Space and shape

The base unit is 4 px, with an 8 px rhythm and primary steps of 8, 12, 16, 24, 32, 48, and 72 px. Content caps at 1180 px. Interactive targets are at least 44 px. Corners are asymmetric and softly thrown: 18 px working surfaces, 999 px tags, with one tighter corner on feature panels. Shadows are cool and broad (`0 18px 50px rgba(34, 55, 51, .08)`), used only for lifted controls and the imported score workspace.

## Interaction grammar

- Import is the sole primary action before a score exists.
- Once imported, the score is the primary surface. A hairline cobalt sightline marks “now”; a translucent window and labeled flag mark “coming up.”
- Range cards behave like ceramic rehearsal tiles: selected tiles lift 2 px and gain a cobalt edge. Pass / needs-work stamps stay visible as words, never color alone.
- Keyboard grammar: Space plays/pauses; Left/Right move one measure; Shift+Left/Right move four; `L` creates a range from the visible look-ahead window when focus is not in a field.
- Destructive actions name their target and require confirmation; newly deleted ranges can be undone.

## Motion

Motion has the logic of sliding a paper score beneath a fixed reading mark. The score track translates for 220 ms with an ease-out curve; tiles enter with a 180 ms opacity/translate transition. Nothing loops or flashes. Under `prefers-reduced-motion: reduce`, translations and smooth scrolling become instant and state changes use opacity only.

## Responsive intent

At 390 px, navigation becomes a compact brand row, the hero illustration is cropped to its quiet center, score controls wrap in task order, and the queue becomes one column. The sightline retains measure labels and hides nonessential beat subdivisions. Print output removes all chrome and renders a clean cue sheet.

## Asset plan and provenance

One original hero still-life will establish the product world: an abstract folded paper score and cobalt rehearsal marker resting on hand-thrown porcelain forms in a cold daylight studio. It explains “see the music before it arrives” through a second illuminated plane ahead of the marker. It is atmosphere only—not a claim that photographed notation is parsed.

Prompt sheet:

> Use case: stylized-concept. Asset type: responsive landing-page hero illustration. Scene/backdrop: quiet pale glacial studio with soft horizon and generous negative space. Subject: an abstract folded blank music-score ribbon gliding over two low hand-thrown porcelain forms, with a single slim cobalt ceramic marker and a second translucent porcelain plane slightly ahead, suggesting musical look-ahead. Style/medium: editorial still-life photography blended with refined tactile 3D, restrained and believable. Composition/framing: wide landscape, objects weighted to the right and center, calm negative space at upper left, no UI mockup. Lighting/mood: diffuse winter daylight, serene, precise, soft cool shadows. Color palette: frost white, celadon ice, graphite, cobalt blue. Materials/textures: matte glaze, subtle paper tooth, faint handmade irregularity. Constraints: abstract non-readable staff marks only, no people, no instruments, no text, no watermark, no logos. Avoid: generic gradients, neon, glassmorphism, floating app cards, legible sheet music, copyrighted notation, dramatic bloom, clutter.

Generation: Azure AI Foundry factory image deployment via `/opt/fleet/lib/gen-image.sh`, 2026-08-27. The selected original and its exact prompt sidecar live in `assets/src/`; optimized WebP derivatives live in `public/assets/`. Generated imagery is disclosed in the site footer.

Icons are original inline SVG marks built from staff lines, cue brackets, and simple geometric controls. They use `currentColor`, and informative icons have accessible names while decorative icons are hidden.
