import './style.css';
import { parseScoreFile } from './musicxml';
import { clearSession, loadSession, saveSession } from './storage';
import { cachedUnlock, captureLicenseFromUrl, checkoutUrl, hasLicenseToken, storeLicense, verifyLicense } from './license';
import type { Measure, ParsedScore, RehearsalRange, SavedSession, ScorePart } from './types';

const app = document.querySelector<HTMLDivElement>('#app') as HTMLDivElement;
if (!app) throw new Error('App root is missing');

let session: SavedSession | null = loadSession();
let unlocked = cachedUnlock();
let playing = false;
let playStarted = 0;
let lastDeleted: RehearsalRange | null = null;
let loading = false;
let notice = '';
let errorMessage = '';

const icon = (name: 'mark' | 'upload' | 'play' | 'pause' | 'print' | 'plus' | 'lock'): string => {
  const paths = {
    mark: '<path d="M4 7h16M4 12h16M4 17h16M15 3v18"/>',
    upload: '<path d="M12 16V3m0 0L7 8m5-5 5 5M4 15v5h16v-5"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    print: '<path d="M7 9V3h10v6M7 17H4V9h16v8h-3m-10-4h10v8H7v-8Z"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    lock: '<path d="M6 10h12v11H6V10Zm3 0V7a3 3 0 0 1 6 0v3"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
};

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] || character));

const header = (): string => `
  <header class="site-header">
    <a class="wordmark" href="/" aria-label="Rehearsal Sightline home">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
      <span>Rehearsal <em>Sightline</em></span>
    </a>
    <nav aria-label="Primary navigation">
      <a href="/#workspace">Workspace</a>
      <a href="/#studio">Studio unlock</a>
      <span class="offline-state" data-online>${navigator.onLine ? 'Private · on device' : 'Offline · ready'}</span>
    </nav>
  </header>`;

const footer = (): string => `
  <footer class="site-footer">
    <div><span class="footer-mark" aria-hidden="true"></span><strong>Rehearsal Sightline</strong><p>Your score stays in this browser.</p></div>
    <nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-rehearsal-sightline" rel="noreferrer">Source</a></nav>
    <p class="generation-note">Ceramic still life generated for this product with Azure AI Foundry.</p>
  </footer>`;

function legalPage(kind: 'privacy' | 'terms'): string {
  const privacy = `
    <p class="eyebrow">Plain-language policy</p><h1>Privacy, without a backstage.</h1>
    <p class="lede">Rehearsal Sightline processes MusicXML in your browser. We do not receive, host, analyze, or distribute your scores.</p>
    <h2>What stays on your device</h2><p>Your imported score structure, selected part, rehearsal ranges, notes, statuses, and preferences are stored in your browser’s local storage. Clearing site data removes them. Export a plan first if you want a backup.</p>
    <h2>What leaves your device</h2><p>Nothing during the free score workflow. If you buy or verify Studio, your browser contacts the Sociobot billing API with your license token. Sociobot/Dodo is the merchant of record and processes checkout information under its own policies. We do not use advertising cookies, analytics, fingerprinting, or third-party fonts.</p>
    <h2>Offline use</h2><p>After a first visit, the app shell can work offline. A license check is cached for at most one day; being offline never blocks the free workspace.</p>
    <h2>Your control</h2><p>Use “Remove score from this device” in the workspace to delete the active score and plan. License data can be removed by clearing this site’s browser storage.</p>`;
  const terms = `
    <p class="eyebrow">Terms of use</p><h1>Bring your own score. Keep your rights.</h1>
    <p class="lede">Rehearsal Sightline is a local planning utility for MusicXML you are entitled to use. It is not a score marketplace or notation distributor.</p>
    <h2>Your responsibilities</h2><p>Only import material you own or have permission to use. Do not use the product to distribute copyrighted notation. The app creates rehearsal notes and cue sheets; it does not grant rights in the underlying score.</p>
    <h2>Studio purchase</h2><p>Studio is an introductory US$12 one-time license for the features described at purchase. Sociobot/Dodo is the merchant of record. Checkout, receipts, taxes, and refunds are handled there. A refund revokes the associated license automatically. No subscription is created.</p>
    <h2>Availability and warranty</h2><p>The software is provided “as is” under the MIT License. MusicXML varies by exporter, so confirm measure numbers and cues against your source before rehearsal. We may improve or discontinue hosted access, but exported files remain yours.</p>
    <h2>Fair use of the service</h2><p>Do not attempt to bypass license verification, interfere with the hosted service, or use it unlawfully. Accessibility, safety behavior, and core plan export remain available without Studio.</p>`;
  return `${header()}<main id="main" class="legal-page">${kind === 'privacy' ? privacy : terms}<p><a class="text-link" href="/">← Return to the workspace</a></p></main>${footer()}`;
}

function currentPart(): ScorePart | null {
  if (!session) return null;
  return session.score.parts.find(part => part.id === session?.partId) || session.score.parts[0] || null;
}

function formatMeasure(part: ScorePart, index: number): string {
  return part.measures[index]?.number || String(index + 1);
}

function noteSvg(measure: Measure): string {
  const staff = [24, 32, 40, 48, 56].map(y => `<line x1="4" y1="${y}" x2="116" y2="${y}"/>`).join('');
  const scale: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const notes = measure.notes.filter(note => !note.chord).slice(0, 10);
  const marks = notes.length ? notes.map((note, index) => {
    const x = 12 + (index * 96 / Math.max(notes.length - 1, 1));
    if (note.rest) return `<rect class="rest-glyph" x="${x - 3}" y="37" width="7" height="6" rx="1"/>`;
    const pitch = ((note.octave - 4) * 7) + (scale[note.step] ?? 0);
    const y = Math.max(12, Math.min(67, 52 - pitch * 4));
    const accidental = note.alter ? `<text x="${x - 8}" y="${y + 4}">${note.alter > 0 ? '♯' : '♭'}</text>` : '';
    return `${accidental}<ellipse cx="${x}" cy="${y}" rx="5" ry="3.5" transform="rotate(-16 ${x} ${y})"/><line class="stem" x1="${x + 4}" y1="${y}" x2="${x + 4}" y2="${Math.max(8, y - 23)}"/>`;
  }).join('') : '<text class="empty-measure" x="60" y="44" text-anchor="middle">whole measure rest</text>';
  return `<svg class="notation" viewBox="0 0 120 76" role="img" aria-label="Notation sketch for measure ${escapeHtml(measure.number)}"><g class="staff">${staff}</g><g class="notes">${marks}</g></svg>`;
}

function hero(): string {
  return `<section class="hero" aria-labelledby="page-title">
    <div class="hero-copy"><p class="eyebrow"><span></span> A clear measure ahead</p><h1 id="page-title">See the music<br><i>before it arrives.</i></h1>
    <p>Turn your own MusicXML into a calm rehearsal queue. Set the sightline, mark playable slices, and keep honest notes—entirely in your browser.</p>
    ${session ? `<a class="button primary" href="#workspace">Continue “${escapeHtml(session.score.title)}”</a>` : `<label class="button primary file-label">${icon('upload')} Import MusicXML<input id="score-file" type="file" accept=".musicxml,.xml,.mxl,application/vnd.recordare.musicxml+xml,application/vnd.recordare.musicxml" /></label>`}
    <span class="hero-hint">MusicXML, XML, or MXL · up to 25 MB</span></div>
    <picture class="hero-art"><source media="(max-width: 700px)" srcset="/assets/hero-ceramic-score-768.webp"><img src="/assets/hero-ceramic-score-1280.webp" width="1280" height="853" alt="Abstract paper score flowing over pale ceramic forms beside a blue sightline marker" fetchpriority="high" decoding="async"></picture>
  </section>`;
}

function emptyWorkspace(): string {
  return `<section id="workspace" class="empty-workspace" aria-labelledby="empty-title">
    <div class="empty-staff" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b></b></div>
    <div><p class="eyebrow">Your rehearsal room</p><h2 id="empty-title">Begin with your part.</h2><p>Import a score exported as MusicXML. It is parsed here, never uploaded. You can choose your instrument after import.</p>
    <label class="button secondary file-label">${icon('upload')} Choose a score<input id="score-file-secondary" type="file" accept=".musicxml,.xml,.mxl" /></label></div>
  </section>`;
}

function sightline(part: ScorePart): string {
  if (!session) return '';
  const start = session.current;
  const end = Math.min(part.measures.length - 1, start + session.lookahead);
  return `<div class="score-strip" tabindex="0" aria-label="Score sightline, measures ${escapeHtml(formatMeasure(part, start))} through ${escapeHtml(formatMeasure(part, end))}">
    <div class="sightline-key"><span>Now</span><span>Coming up · ${session.lookahead} ${session.lookahead === 1 ? 'measure' : 'measures'}</span></div>
    <div class="measure-row">${part.measures.slice(start, end + 1).map((measure, offset) => `<article class="measure-tile ${offset === 0 ? 'is-current' : 'is-ahead'}" aria-label="Measure ${escapeHtml(measure.number)}${measure.rehearsal ? `, ${escapeHtml(measure.rehearsal)}` : ''}">
      <div class="measure-meta"><strong>${offset === 0 ? 'NOW' : `+${offset}`}</strong><span>m. ${escapeHtml(measure.number)}</span></div>${noteSvg(measure)}${measure.rehearsal ? `<p class="rehearsal-mark">${escapeHtml(measure.rehearsal)}</p>` : ''}
    </article>`).join('')}</div>
  </div>`;
}

function rangeCard(range: RehearsalRange, part: ScorePart, index: number): string {
  const statusLabel = { planned: 'Planned', 'needs-work': 'Needs work', passed: 'Passed' }[range.status];
  return `<li class="range-card" data-range-id="${escapeHtml(range.id)}">
    <button class="range-load" data-action="load-range" aria-label="Go to ${escapeHtml(range.label)}"><span class="range-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${escapeHtml(range.label)}</strong><small>Measures ${escapeHtml(formatMeasure(part, range.start))}–${escapeHtml(formatMeasure(part, range.end))}${range.targetTempo ? ` · ♩ ${range.targetTempo}` : ''}</small></span></button>
    <label class="status-label">Result<select data-action="range-status" aria-label="Result for ${escapeHtml(range.label)}"><option value="planned" ${range.status === 'planned' ? 'selected' : ''}>Planned</option><option value="needs-work" ${range.status === 'needs-work' ? 'selected' : ''}>Needs work</option><option value="passed" ${range.status === 'passed' ? 'selected' : ''}>Passed</option></select></label>
    <label class="note-label">Player note<textarea data-action="range-note" rows="2" placeholder="Bow change, breath, fingering…">${escapeHtml(range.note)}</textarea></label>
    <div class="range-card-foot"><span class="status-stamp ${range.status}">${statusLabel}</span><button class="text-button danger" data-action="delete-range">Remove</button></div>
  </li>`;
}

function printSheet(part: ScorePart): string {
  if (!session) return '';
  const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date());
  return `<section class="print-sheet" aria-hidden="true"><header><span>REHEARSAL SIGHTLINE / CUE SHEET</span><span>${escapeHtml(date)}</span></header><h2>${escapeHtml(session.score.title)}</h2><p>${escapeHtml(part.name)}${session.score.composer ? ` · ${escapeHtml(session.score.composer)}` : ''}</p>
    <ol>${session.ranges.map(range => `<li><div><strong>${escapeHtml(range.label)}</strong><span>Measures ${escapeHtml(formatMeasure(part, range.start))}–${escapeHtml(formatMeasure(part, range.end))}</span></div><b>${range.status === 'needs-work' ? 'NEEDS WORK' : range.status.toUpperCase()}</b>${range.targetTempo ? `<small>Target ♩ = ${range.targetTempo}</small>` : ''}<p>${escapeHtml(range.note || 'No player note yet.')}</p></li>`).join('')}</ol>
    <footer>Made locally with Rehearsal Sightline · rehearsal-sightline.sociobot.in</footer></section>`;
}

function workspace(): string {
  if (!session) return emptyWorkspace();
  const part = currentPart();
  if (!part) return emptyWorkspace();
  const measure = part.measures[session.current] || part.measures[0];
  if (!measure) return emptyWorkspace();
  const currentIndex = session.current;
  const maxLookahead = unlocked ? 16 : 8;
  const defaultEnd = Math.min(part.measures.length - 1, session.current + Math.max(1, Math.min(session.lookahead, 4)) - 1);
  return `<section id="workspace" class="workspace" aria-labelledby="workspace-title">
    <div class="workspace-heading"><div><p class="eyebrow">Current score</p><h2 id="workspace-title">${escapeHtml(session.score.title)}</h2><p>${session.score.composer ? `${escapeHtml(session.score.composer)} · ` : ''}${part.measures.length} measures</p></div>
      <div class="workspace-actions"><label class="select-label">Part<select id="part-select">${session.score.parts.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === part.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select></label><button class="button quiet" data-action="print" ${session.ranges.length ? '' : 'disabled'}>${icon('print')} Print cue sheet</button><button class="overflow-button" data-action="toggle-more" aria-expanded="false" aria-controls="more-menu">More<span aria-hidden="true">•••</span></button></div>
      <div id="more-menu" class="more-menu" hidden><button data-action="export-json">Export plan backup</button><label>Import plan backup<input id="plan-file" type="file" accept="application/json,.json"></label><label>Import another score<input id="replace-score-file" type="file" accept=".musicxml,.xml,.mxl"></label><button class="danger" data-action="clear-session">Remove score from this device</button></div>
    </div>
    <div class="transport" aria-label="Rehearsal clock controls">
      <button class="play-button" data-action="toggle-play" aria-label="${playing ? 'Pause rehearsal clock' : 'Start rehearsal clock'}">${icon(playing ? 'pause' : 'play')}<span>${playing ? 'Pause' : 'Start'}</span></button>
      <button class="step-button" data-action="previous" aria-label="Previous measure">← <span>Previous</span></button>
      <div class="position"><span>Measure</span><strong>${escapeHtml(measure.number)}</strong><small>${measure.beats}/${measure.beatType} · ♩ ${Math.round(measure.tempo)}</small></div>
      <button class="step-button" data-action="next" aria-label="Next measure"><span>Next</span> →</button>
      <label class="scrubber"><span>Position <b>${session.current + 1} / ${part.measures.length}</b></span><input id="position-range" type="range" min="0" max="${part.measures.length - 1}" value="${session.current}" aria-label="Current measure position"></label>
      <label class="lookahead-control"><span>Look ahead <b>${session.lookahead}</b></span><input id="lookahead-range" type="range" min="1" max="${maxLookahead}" value="${Math.min(session.lookahead, maxLookahead)}"><small>${unlocked ? 'Studio range: up to 16 measures' : 'Free range: up to 8 · Studio adds 16'}</small></label>
    </div>
    ${sightline(part)}
    <div class="planning-grid">
      <section class="range-builder" aria-labelledby="builder-title"><p class="eyebrow">Mark a slice</p><h3 id="builder-title">Make the next passage manageable.</h3><p>Start with the visible music, then tighten the edges.</p>
        <form id="range-form"><div class="measure-pair"><label>Start measure<select id="range-start" name="start">${part.measures.map((item, index) => `<option value="${index}" ${index === currentIndex ? 'selected' : ''}>m. ${escapeHtml(item.number)}</option>`).join('')}</select></label><span aria-hidden="true">→</span><label>End measure<select id="range-end" name="end">${part.measures.map((item, index) => `<option value="${index}" ${index === defaultEnd ? 'selected' : ''}>m. ${escapeHtml(item.number)}</option>`).join('')}</select></label></div>
          <label>Slice name<input name="label" maxlength="60" value="Measures ${escapeHtml(formatMeasure(part, session.current))}–${escapeHtml(formatMeasure(part, defaultEnd))}" required></label>
          <label>First player note <textarea name="note" maxlength="500" rows="3" placeholder="What is likely to stop you?"></textarea></label>
          <label class="tempo-field ${unlocked ? '' : 'is-locked'}">Target tempo <span>${unlocked ? 'Studio' : `${icon('lock')} Studio`}</span><input name="tempo" type="number" min="20" max="300" placeholder="e.g. 88" ${unlocked ? '' : 'disabled'}></label>
          <button class="button primary full" type="submit">${icon('plus')} Add to rehearsal queue</button></form>
      </section>
      <section class="queue" aria-labelledby="queue-title"><div class="section-title"><div><p class="eyebrow">Rehearsal queue</p><h3 id="queue-title">${session.ranges.length} ${session.ranges.length === 1 ? 'slice' : 'slices'} marked</h3></div><span>${session.ranges.filter(range => range.status === 'passed').length} passed</span></div>
        ${session.ranges.length ? `<ol class="range-list">${session.ranges.map((range, index) => rangeCard(range, part, index)).join('')}</ol>` : `<div class="queue-empty"><span aria-hidden="true">⌜</span><p><strong>No slices yet.</strong> Mark the music currently in view. Four short, intentional ranges make a strong first rehearsal.</p></div>`}
      </section>
    </div>
    ${printSheet(part)}
  </section>`;
}

function studioSection(): string {
  return `<section id="studio" class="studio-section" aria-labelledby="studio-title"><div class="studio-copy"><p class="eyebrow">One-time Studio unlock</p><h2 id="studio-title">A longer view for deeper rehearsals.</h2><p>The complete free workspace—including unlimited slices, notes, print, and backup export—is yours. Studio adds a 16-measure sightline and target tempo cues to every range.</p><ul><li>Look ahead up to 16 measures</li><li>Add target tempos to queue and cue sheet</li><li>One license, restored on your devices</li></ul></div>
    <div class="studio-purchase"><span class="price"><strong>US$12</strong><small>one-time · no subscription</small></span>${unlocked ? `<p class="license-active">✓ Studio unlock active</p>` : `<a class="button primary full" href="${checkoutUrl}">Buy Studio securely</a>`}
      <details><summary>Have a license? Restore it</summary><form id="license-form"><label>License token<input name="license" type="text" autocomplete="off" spellcheck="false" required></label><button class="button secondary full" type="submit" aria-label="Verify Studio license">Verify license</button></form></details><p class="fine-print">Checkout, receipts, and refunds are handled by Sociobot/Dodo, the merchant of record. <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a></p></div>
  </section>`;
}

function render(): void {
  const path = location.pathname.replace(/\/$/, '') || '/';
  if (path === '/privacy' || path === '/terms') {
    app.innerHTML = legalPage(path.slice(1) as 'privacy' | 'terms');
    return;
  }
  app.innerHTML = `${header()}<main id="main">${hero()}${loading ? '<div class="loading-state" role="status"><span></span>Reading your MusicXML…</div>' : ''}${workspace()}${studioSection()}</main>${footer()}<div id="live-region" class="toast ${errorMessage ? 'is-error' : ''}" role="status" aria-live="polite">${escapeHtml(errorMessage || notice)}${lastDeleted ? ' ' + '<button data-action="undo-delete">Undo</button>' : ''}</div>`;
  bindInputs();
}

function persist(): void {
  if (!session) return;
  try { saveSession(session); errorMessage = ''; } catch (error) { errorMessage = error instanceof Error ? error.message : 'Could not save this plan.'; }
}

async function importScore(file: File): Promise<void> {
  if (session && !confirm(`Import “${file.name}” and replace the plan for “${session.score.title}”? Export a backup first if you need it.`)) return;
  loading = true; errorMessage = ''; render();
  await new Promise(resolve => setTimeout(resolve, 20));
  try {
    const score = await parseScoreFile(file);
    session = { score, partId: score.parts[0]?.id || '', lookahead: 4, current: 0, ranges: [] };
    persist(); notice = `${score.title} is ready. Choose your part and mark a slice.`;
    setTimeout(() => document.querySelector('#workspace')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 0);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'The score could not be opened.';
  } finally { loading = false; render(); }
}

function addRange(form: HTMLFormElement): void {
  if (!session) return;
  const part = currentPart();
  if (!part) return;
  const data = new FormData(form);
  const start = Number(data.get('start'));
  const end = Number(data.get('end'));
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end >= part.measures.length) {
    errorMessage = `Choose an end measure at or after ${formatMeasure(part, Math.max(0, start))}.`; render(); return;
  }
  const tempo = unlocked ? Number(data.get('tempo')) : 0;
  const range: RehearsalRange = { id: crypto.randomUUID(), start, end, label: String(data.get('label') || `Measures ${start + 1}–${end + 1}`), note: String(data.get('note') || ''), status: 'planned', ...(tempo ? { targetTempo: tempo } : {}) };
  session.ranges.push(range); persist(); notice = `${range.label} added to the queue.`; errorMessage = ''; render();
  document.querySelector(`[data-range-id="${CSS.escape(range.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function exportPlan(): void {
  if (!session) return;
  const blob = new Blob([JSON.stringify({ format: 'rehearsal-sightline/v1', exportedAt: new Date().toISOString(), ...session }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `${session.score.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'rehearsal'}-sightline.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); notice = 'Plan backup exported.'; render();
}

async function importPlan(file: File): Promise<void> {
  try {
    const value = JSON.parse(await file.text()) as SavedSession & { format?: string };
    if (value.format !== 'rehearsal-sightline/v1' || !value.score?.parts?.length || !Array.isArray(value.ranges)) throw new Error('not a plan');
    if (session && !confirm(`Replace “${session.score.title}” with the plan in “${file.name}”?`)) return;
    session = value; session.current = Math.max(0, session.current || 0); persist(); notice = 'Plan backup restored.'; render();
  } catch { errorMessage = 'That file is not a valid Rehearsal Sightline plan backup.'; render(); }
}

function bindInputs(): void {
  document.querySelectorAll<HTMLInputElement>('#score-file, #score-file-secondary, #replace-score-file').forEach(input => input.addEventListener('change', () => { const file = input.files?.[0]; if (file) void importScore(file); }));
  document.querySelector<HTMLSelectElement>('#part-select')?.addEventListener('change', event => {
    if (!session) return;
    const select = event.target as HTMLSelectElement;
    const nextPart = session.score.parts.find(part => part.id === select.value);
    if (session.ranges.length && !confirm(`Switch to ${nextPart?.name || 'this part'} and clear the ${session.ranges.length} marked ${session.ranges.length === 1 ? 'slice' : 'slices'} for ${currentPart()?.name || 'the current part'}?`)) { select.value = session.partId; return; }
    session.partId = select.value; session.current = 0; session.ranges = []; persist(); notice = 'Part changed; the rehearsal queue is ready for this part.'; render();
  });
  document.querySelector<HTMLInputElement>('#position-range')?.addEventListener('input', event => { if (!session) return; playing = false; session.current = Number((event.target as HTMLInputElement).value); persist(); render(); });
  document.querySelector<HTMLInputElement>('#lookahead-range')?.addEventListener('input', event => { if (!session) return; session.lookahead = Number((event.target as HTMLInputElement).value); persist(); render(); });
  document.querySelector<HTMLFormElement>('#range-form')?.addEventListener('submit', event => { event.preventDefault(); addRange(event.currentTarget as HTMLFormElement); });
  document.querySelector<HTMLInputElement>('#plan-file')?.addEventListener('change', event => { const file = (event.target as HTMLInputElement).files?.[0]; if (file) void importPlan(file); });
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', async event => {
    event.preventDefault(); const form = new FormData(event.currentTarget as HTMLFormElement); const token = String(form.get('license') || '').trim();
    if (!token) return; storeLicense(token); notice = 'Checking your license…'; render();
    const result = await verifyLicense(true); unlocked = result.valid; notice = result.message; if (session && !unlocked && session.lookahead > 8) session.lookahead = 8; persist(); render();
  });
}

app.addEventListener('change', event => {
  const target = event.target as HTMLElement;
  const card = target.closest<HTMLElement>('[data-range-id]');
  if (!session || !card) return;
  const range = session.ranges.find(item => item.id === card.dataset.rangeId); if (!range) return;
  if (target.matches('[data-action="range-status"]')) range.status = (target as HTMLSelectElement).value as RehearsalRange['status'];
  if (target.matches('[data-action="range-note"]')) range.note = (target as HTMLTextAreaElement).value;
  persist();
});

app.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const part = currentPart();
  if (action === 'toggle-more') { const menu = document.querySelector<HTMLElement>('#more-menu'); if (menu) { menu.hidden = !menu.hidden; target.setAttribute('aria-expanded', String(!menu.hidden)); } return; }
  if (action === 'print') { window.print(); return; }
  if (action === 'export-json') { exportPlan(); return; }
  if (action === 'clear-session' && session && confirm(`Remove “${session.score.title}” and all its rehearsal notes from this device? This cannot be undone.`)) { clearSession(); session = null; playing = false; notice = 'Score and plan removed from this device.'; render(); return; }
  if (!session || !part) return;
  if (action === 'toggle-play') { playing = !playing; playStarted = performance.now(); notice = playing ? 'Rehearsal clock started.' : 'Rehearsal clock paused.'; render(); return; }
  if (action === 'previous') { playing = false; session.current = Math.max(0, session.current - 1); persist(); render(); return; }
  if (action === 'next') { playing = false; session.current = Math.min(part.measures.length - 1, session.current + 1); persist(); render(); return; }
  const card = target.closest<HTMLElement>('[data-range-id]'); const rangeIndex = card ? session.ranges.findIndex(item => item.id === card.dataset.rangeId) : -1; const range = rangeIndex >= 0 ? session.ranges[rangeIndex] : undefined;
  if (action === 'load-range' && range) { session.current = range.start; playing = false; persist(); render(); document.querySelector('.score-strip')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (action === 'delete-range' && range && confirm(`Remove “${range.label}” from the rehearsal queue?`)) { lastDeleted = range; session.ranges.splice(rangeIndex, 1); persist(); notice = `${range.label} removed.`; render(); }
  if (action === 'undo-delete' && lastDeleted) { session.ranges.push(lastDeleted); notice = `${lastDeleted.label} restored.`; lastDeleted = null; persist(); render(); }
});

document.addEventListener('keydown', event => {
  if (!session || location.pathname !== '/') return;
  const element = event.target as HTMLElement;
  if (element.matches('input, textarea, select, button, a, summary') || element.isContentEditable) return;
  const part = currentPart(); if (!part) return;
  if (event.code === 'Space') { event.preventDefault(); playing = !playing; playStarted = performance.now(); render(); }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); playing = false; const step = event.shiftKey ? 4 : 1; session.current = Math.max(0, Math.min(part.measures.length - 1, session.current + (event.key === 'ArrowRight' ? step : -step))); persist(); render(); }
  if (event.key.toLowerCase() === 'l') { const end = Math.min(part.measures.length - 1, session.current + Math.max(1, Math.min(4, session.lookahead)) - 1); session.ranges.push({ id: crypto.randomUUID(), start: session.current, end, label: `Measures ${formatMeasure(part, session.current)}–${formatMeasure(part, end)}`, note: '', status: 'planned' }); persist(); notice = 'Visible slice added. Press Tab to reach its note field.'; render(); }
});

setInterval(() => {
  if (!playing || !session) return;
  const part = currentPart(); const measure = part?.measures[session.current]; if (!part || !measure) return;
  const duration = measure.beats * (4 / measure.beatType) * (60_000 / Math.max(measure.tempo, 20));
  if (performance.now() - playStarted >= duration) {
    if (session.current >= part.measures.length - 1) { playing = false; notice = 'End of the part.'; }
    else { session.current += 1; playStarted = performance.now(); persist(); }
    render();
  }
}, 200);

window.addEventListener('online', () => { document.querySelectorAll<HTMLElement>('[data-online]').forEach(el => { el.textContent = 'Private · on device'; }); void reconcileLicense(); });
window.addEventListener('offline', () => document.querySelectorAll<HTMLElement>('[data-online]').forEach(el => { el.textContent = 'Offline · ready'; }));

async function reconcileLicense(): Promise<void> {
  if (!hasLicenseToken()) return;
  const result = await verifyLicense();
  const changed = unlocked !== result.valid;
  unlocked = result.valid;
  if (changed) { notice = result.message; if (session && !unlocked && session.lookahead > 8) { session.lookahead = 8; persist(); } render(); }
}

const captured = captureLicenseFromUrl();
if (captured) notice = 'License received. Verifying your Studio unlock…';
render();
void reconcileLicense();

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
