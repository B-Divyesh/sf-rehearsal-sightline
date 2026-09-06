import './style.css';
import { parseScoreFile } from './musicxml';
import { createDemoSession } from './sample';
import { clearSession, loadSession, saveSession } from './storage';
import { cachedUnlock, captureLicenseFromUrl, hasLicenseToken, storeLicense, useDemoLicenseStorage, verifyLicense } from './license';
import type { Measure, RehearsalRange, SavedSession, ScorePart } from './types';

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) throw new Error('App root is missing');
const app: HTMLDivElement = appRoot;

const ORIGIN = 'https://rehearsal-sightline.sociobot.in';
const APP_ROUTES = new Set(['/', '/demo', '/privacy', '/terms', '/privacy-request']);

type RouteDetails = { title: string; description: string; canonical: string; announcement: string };

function pathFromLocation(): string {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  return path === '/index.html' ? '/' : path;
}

function routeDetails(path: string): RouteDetails {
  const routes: Record<string, RouteDetails> = {
    '/': {
      title: 'Rehearsal Sightline — Plan MusicXML rehearsal slices',
      description: 'Plan MusicXML rehearsal slices with a look-ahead view for orchestra and band players. Scores stay in your browser.',
      canonical: `${ORIGIN}/`,
      announcement: 'Rehearsal Sightline home',
    },
    '/demo': {
      title: 'Demo — Rehearsal Sightline',
      description: 'Try a populated MusicXML rehearsal plan. Demo notes stay separate from your own score plan.',
      canonical: `${ORIGIN}/demo`,
      announcement: 'Demo',
    },
    '/privacy': {
      title: 'Privacy — Rehearsal Sightline',
      description: 'Read how Rehearsal Sightline keeps MusicXML scores and rehearsal plans in your browser.',
      canonical: `${ORIGIN}/privacy`,
      announcement: 'Privacy',
    },
    '/terms': {
      title: 'Terms — Rehearsal Sightline',
      description: 'Read the terms for using Rehearsal Sightline with MusicXML scores you are allowed to use.',
      canonical: `${ORIGIN}/terms`,
      announcement: 'Terms',
    },
    '/privacy-request': {
      title: 'Request purchase data — Rehearsal Sightline',
      description: 'Find out how to request purchase or license data handled by the merchant for Rehearsal Sightline.',
      canonical: `${ORIGIN}/privacy-request`,
      announcement: 'Request purchase data',
    },
  };
  return routes[path] || {
    title: 'Page not found — Rehearsal Sightline',
    description: 'This Rehearsal Sightline page is not available.',
    canonical: `${ORIGIN}/404.html`,
    announcement: 'Page not found',
  };
}

function setMeta(attribute: 'name' | 'property', key: string, value: string): void {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.append(meta);
  }
  meta.content = value;
}

function updateMetadata(path: string): void {
  const details = routeDetails(path);
  document.title = details.title;
  setMeta('name', 'description', details.description);
  setMeta('property', 'og:title', details.title);
  setMeta('property', 'og:description', details.description);
  setMeta('property', 'og:url', details.canonical);
  setMeta('property', 'og:image', `${ORIGIN}/assets/social-card.jpg`);
  setMeta('property', 'og:image:alt', 'An abstract paper score and cobalt marker on pale ceramic forms.');
  setMeta('property', 'og:type', 'website');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', details.title);
  setMeta('name', 'twitter:description', details.description);
  setMeta('name', 'twitter:image', `${ORIGIN}/assets/social-card.jpg`);
  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = details.canonical;
}

function prepareDirectDemoUrl(): void {
  const url = new URL(location.href);
  if (pathFromLocation() !== '/' || url.searchParams.get('demo') !== '1') return;
  url.pathname = '/demo';
  url.searchParams.delete('demo');
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

prepareDirectDemoUrl();
let demoMode = pathFromLocation() === '/demo';
useDemoLicenseStorage(demoMode);
let session: SavedSession | null = loadSession(demoMode);
if (demoMode && !session) {
  session = createDemoSession();
  saveSession(session, true);
}
let unlocked = cachedUnlock();
let playing = false;
let playStarted = 0;
let lastDeleted: RehearsalRange | null = null;
let loading = false;
let notice = '';
let errorMessage = '';

const icon = (name: 'upload' | 'play' | 'pause' | 'print' | 'plus' | 'lock'): string => {
  const paths = {
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

function header(): string {
  return `<header class="site-header">
    <a class="wordmark" href="/" aria-label="Rehearsal Sightline home">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
      <span>Rehearsal <em>Sightline</em></span>
    </a>
    <nav aria-label="Primary navigation">
      <a href="/demo">Demo</a>
      <a href="/#how-it-works">How it works</a>
      <a href="/#studio">Studio</a>
      <a href="/privacy">Privacy</a>
    </nav>
    <span class="offline-state" data-online>${navigator.onLine ? 'Private · on device' : 'Offline · ready'}</span>
  </header>`;
}

function footer(): string {
  return `<footer class="site-footer">
    <div><span class="footer-mark" aria-hidden="true"></span><strong>Rehearsal Sightline</strong><p>Plan MusicXML rehearsal slices with a look-ahead view.</p></div>
    <nav aria-label="Footer links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-rehearsal-sightline" rel="noreferrer">Source <span class="sr-only">(opens in a new tab)</span></a></nav>
    <p class="factory-note">Built by Param Factory · Version 1.1.0</p>
    <p class="generation-note">Ceramic still life generated for this product with Azure AI Foundry.</p>
  </footer>`;
}

function legalPage(kind: 'privacy' | 'terms' | 'privacy-request'): string {
  if (kind === 'privacy-request') {
    return `<main id="main" class="legal-page"><p class="eyebrow">Purchase data request</p><h1>Request purchase data</h1>
      <p class="lede">Your MusicXML score and rehearsal plan stay in your browser. Rehearsal Sightline does not receive them.</p>
      <h2>Purchase and license requests</h2><p>Sociobot/Dodo handles any checkout, receipt, tax, refund, and license data. Use the support link in your purchase receipt to request access, correction, or deletion of that data.</p>
      <h2>What to include</h2><p>Include the purchase email, receipt number, and the request you want fulfilled. Do not send your MusicXML score or rehearsal notes. They are not held by this product.</p>
      <h2>Local score data</h2><p>Use “Remove score from this device” to delete an active plan. Clearing this site’s browser data also removes local plans and saved license tokens.</p>
      <p><a class="text-link" href="/privacy">Return to Privacy</a></p></main>`;
  }
  const privacy = `<main id="main" class="legal-page"><p class="eyebrow">Privacy</p><h1>Keep your MusicXML private</h1>
    <p class="lede">Rehearsal Sightline processes MusicXML in your browser. We do not receive, host, analyze, or distribute your scores.</p>
    <h2>What stays on your device</h2><p>Your imported score structure, selected part, rehearsal ranges, notes, statuses, and preferences are stored in your browser’s local storage. Clearing site data removes them. Export a plan first if you want a backup.</p>
    <h2>What leaves your device</h2><p>Nothing during the free score workflow. If you restore a Studio license, your browser contacts the Sociobot billing API with that token. We do not use advertising cookies, analytics, fingerprinting, or third-party fonts.</p>
    <h2>Offline use</h2><p>After a first visit, the app shell can work offline. A license check is cached for at most one day. Being offline never blocks the free workspace.</p>
    <h2>Request purchase data</h2><p>Sociobot/Dodo is the merchant of record for Studio. <a class="text-link" href="/privacy-request">Read how to request purchase or license data</a>.</p>
    <h2>Your control</h2><p>Use “Remove score from this device” in the workspace to delete the active score and plan. License data can be removed by clearing this site’s browser storage.</p>
    <p><a class="text-link" href="/">Return to the workspace</a></p></main>`;
  const terms = `<main id="main" class="legal-page"><p class="eyebrow">Terms</p><h1>Use your own MusicXML scores</h1>
    <p class="lede">Rehearsal Sightline is a local planning utility for MusicXML you are entitled to use. It is not a score marketplace or notation distributor.</p>
    <h2>Your responsibilities</h2><p>Only import material you own or have permission to use. Do not use the product to distribute copyrighted notation. The app creates rehearsal notes and cue sheets. It does not grant rights in the underlying score.</p>
    <h2>Studio purchase</h2><p>Studio is planned as a US$12 one-time license. Sales are unavailable until Sociobot billing registration is complete. When available, Sociobot/Dodo will handle checkout, receipts, taxes, refunds, and license revocation after a refund. No subscription is planned.</p>
    <h2>Purchase data requests</h2><p>Sociobot/Dodo is the merchant of record. <a class="text-link" href="/privacy-request">Read how to request purchase or license data</a>.</p>
    <h2>Availability and warranty</h2><p>The software is provided “as is” under the MIT License. MusicXML varies by exporter, so confirm measure numbers and cues against your source before rehearsal. Exported files remain yours.</p>
    <h2>Fair use of the service</h2><p>Do not attempt to bypass license verification, interfere with the hosted service, or use it unlawfully. Accessibility, safety behavior, and core plan export remain available without Studio.</p>
    <p><a class="text-link" href="/">Return to the workspace</a></p></main>`;
  return kind === 'privacy' ? privacy : terms;
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
  const realAction = session && !demoMode
    ? '<a class="button secondary" href="/#workspace">Open your saved plan</a>'
    : `<label class="button secondary file-label">${icon('upload')} Import your MusicXML<input id="score-file" type="file" accept=".musicxml,.xml,.mxl,application/vnd.recordare.musicxml+xml,application/vnd.recordare.musicxml" /></label>`;
  return `<section class="hero" aria-labelledby="page-title">
    <div class="hero-copy"><p class="eyebrow"><span></span> MusicXML rehearsal planning</p><h1 id="page-title">Plan MusicXML rehearsal slices</h1>
    <p>For orchestra and band players who want to see the next measures before they arrive.</p>
    <div class="hero-actions"><a class="button primary" href="/demo#workspace">Try it with sample data</a>${realAction}</div>
    <p class="action-hint">The sample opens a score with four marked slices.</p>
    <ul class="hero-facts"><li><strong>Private:</strong> scores stay in this browser.</li><li><strong>Offline:</strong> works after your first visit.</li><li><strong>Price:</strong> the core planner is free.</li></ul></div>
    <picture class="hero-art"><source media="(max-width: 700px)" srcset="/assets/hero-ceramic-score-768.webp"><img src="/assets/hero-ceramic-score-1280.webp" width="1280" height="853" alt="Abstract paper score flowing over pale ceramic forms beside a blue sightline marker" fetchpriority="high" decoding="async"></picture>
  </section>`;
}

function demoBanner(): string {
  if (!demoMode) return '';
  return `<aside class="demo-banner" data-demo-banner aria-label="Demo controls"><div><strong>Demo — sample data, nothing is saved</strong><span>Your own score plan is not read or changed.</span></div><div><button class="button quiet" data-action="reset-demo">Reset demo</button><button class="button secondary" data-action="start-real">Start for real</button></div></aside>`;
}

function emptyWorkspace(): string {
  return `<section id="workspace" class="empty-workspace" aria-labelledby="empty-title">
    <div class="empty-staff" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b></b></div>
    <div><p class="eyebrow">Your score</p><h2 id="empty-title">Import a MusicXML score</h2><p>Choose a score exported as MusicXML. It is read here and is never uploaded. Choose your instrument after import.</p>
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
      <label class="lookahead-control"><span>Look ahead <b>${session.lookahead}</b></span><input id="lookahead-range" type="range" min="1" max="${maxLookahead}" value="${Math.min(session.lookahead, maxLookahead)}" aria-label="Look ahead measures"><small>${unlocked ? 'Studio range: up to 16 measures' : 'Free range: up to 8 · Studio adds 16'}</small></label>
    </div>
    ${sightline(part)}
    <div class="planning-grid">
      <section class="range-builder" aria-labelledby="builder-title"><p class="eyebrow">Mark a slice</p><h3 id="builder-title">Make the next passage manageable</h3><p>Start with the visible music, then tighten the edges.</p>
        <form id="range-form"><div class="measure-pair"><label>Start measure<select id="range-start" name="start">${part.measures.map((item, index) => `<option value="${index}" ${index === currentIndex ? 'selected' : ''}>m. ${escapeHtml(item.number)}</option>`).join('')}</select></label><span aria-hidden="true">→</span><label>End measure<select id="range-end" name="end">${part.measures.map((item, index) => `<option value="${index}" ${index === defaultEnd ? 'selected' : ''}>m. ${escapeHtml(item.number)}</option>`).join('')}</select></label></div>
          <label>Slice name<input name="label" maxlength="60" value="Measures ${escapeHtml(formatMeasure(part, session.current))}–${escapeHtml(formatMeasure(part, defaultEnd))}" required></label>
          <label>First player note <textarea name="note" maxlength="500" rows="3" placeholder="What is likely to stop you?"></textarea></label>
          <label class="tempo-field ${unlocked ? '' : 'is-locked'}">Target tempo <span>${unlocked ? 'Studio' : `${icon('lock')} Studio`}</span><input name="tempo" type="number" min="20" max="300" placeholder="e.g. 88" ${unlocked ? '' : 'disabled'}></label>
          <button class="button primary full" type="submit">${icon('plus')} Add to rehearsal queue</button></form>
      </section>
      <section class="queue" aria-labelledby="queue-title"><div class="section-title"><div><p class="eyebrow">Rehearsal queue</p><h3 id="queue-title">${session.ranges.length} ${session.ranges.length === 1 ? 'slice' : 'slices'} marked</h3></div><span>${session.ranges.filter(range => range.status === 'passed').length} passed</span></div>
        ${session.ranges.length ? `<ol class="range-list">${session.ranges.map((range, index) => rangeCard(range, part, index)).join('')}</ol>` : '<div class="queue-empty"><span aria-hidden="true">⌜</span><p><strong>No slices yet.</strong> Mark the music currently in view. Add a short range to start planning.</p></div>'}
      </section>
    </div>
    ${printSheet(part)}
  </section>`;
}

function howItWorks(): string {
  return '<section id="how-it-works" class="how-it-works" aria-labelledby="how-title"><p class="eyebrow">How it works</p><h2 id="how-title">Plan a rehearsal in three steps</h2><ol><li><strong>1. Import a score</strong><span>Open MusicXML from your device and choose your part.</span></li><li><strong>2. Set the look-ahead</strong><span>Move through measures and choose how much music to see.</span></li><li><strong>3. Mark rehearsal slices</strong><span>Save a range, note what stopped you, then print cues.</span></li></ol></section>';
}

function privacySummary(): string {
  return '<section class="privacy-summary" aria-labelledby="limits-title"><p class="eyebrow">Privacy and limits</p><h2 id="limits-title">What this product does not do</h2><p>It does not scan PDFs, host scores, share notation, or replace engraved parts. Your score stays in this browser during free use.</p><a class="text-link" href="/privacy">Read the Privacy page</a></section>';
}

function studioSection(): string {
  return `<section id="studio" class="studio-section" aria-labelledby="studio-title"><div class="studio-copy"><p class="eyebrow">Studio</p><h2 id="studio-title">Studio features and price</h2><p>The free planner includes slices, notes, cue-sheet printing, and plan backup. Studio will add a 16-measure sightline and target tempo cues.</p><ul><li>Look ahead up to 16 measures</li><li>Add target tempos to queue and cue sheet</li><li>Restore a license on another device</li></ul></div>
    <div class="studio-purchase"><span class="price"><strong>US$12</strong><small>one-time · no subscription</small></span>${unlocked ? '<p class="license-active">✓ Studio unlock active</p>' : '<p class="billing-pending" role="status">Studio checkout is unavailable while Sociobot registers this offer.</p>'}
      <details><summary>Have a Studio license? Restore it</summary><form id="license-form"><label>License token<input name="license" type="text" autocomplete="off" spellcheck="false" required></label><button class="button secondary full" type="submit">Verify license</button></form></details><p class="fine-print">Sociobot/Dodo will handle checkout, receipts, taxes, and refunds. <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a></p></div>
  </section>`;
}

function notFoundPage(): string {
  return '<main id="main" class="legal-page not-found"><p class="eyebrow">404</p><h1>Page not found</h1><p class="lede">This page is not part of Rehearsal Sightline.</p><a class="button primary" href="/">Return to the planner</a></main>';
}

function syncStorageMode(path: string): void {
  const nextDemoMode = path === '/demo';
  if (nextDemoMode === demoMode) return;
  demoMode = nextDemoMode;
  useDemoLicenseStorage(demoMode);
  session = loadSession(demoMode);
  if (demoMode && !session) {
    session = createDemoSession();
    saveSession(session, true);
  }
  unlocked = cachedUnlock();
  playing = false;
  lastDeleted = null;
  notice = '';
  errorMessage = '';
}

function focusRouteHeading(): void {
  const heading = document.querySelector<HTMLElement>('main h1');
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function render(focusHeading = false): void {
  const path = pathFromLocation();
  syncStorageMode(path);
  updateMetadata(path);
  const details = routeDetails(path);
  let body: string;
  if (path === '/privacy' || path === '/terms' || path === '/privacy-request') {
    body = legalPage(path.slice(1) as 'privacy' | 'terms' | 'privacy-request');
  } else if (!APP_ROUTES.has(path)) {
    body = notFoundPage();
  } else {
    body = `<main id="main">${demoBanner()}${hero()}${loading ? '<div class="loading-state" role="status"><span></span>Reading your MusicXML…</div>' : ''}${workspace()}${howItWorks()}${privacySummary()}${studioSection()}</main>`;
  }
  app.innerHTML = `${header()}<div id="route-announcer" class="sr-only" aria-live="polite">${escapeHtml(details.announcement)}</div>${body}${footer()}<div id="live-region" class="toast ${errorMessage ? 'is-error' : ''}" role="status" aria-live="polite">${escapeHtml(errorMessage || notice)}${lastDeleted ? ' <button data-action="undo-delete">Undo</button>' : ''}</div>`;
  bindInputs();
  if (focusHeading) requestAnimationFrame(focusRouteHeading);
}

function persist(): void {
  if (!session) return;
  try {
    saveSession(session, demoMode);
    errorMessage = '';
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Could not save this plan.';
  }
}

function scrollToElement(selector: string): void {
  const element = document.querySelector(selector);
  element?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function navigate(target: string, replace = false): void {
  const url = new URL(target, location.origin);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (!APP_ROUTES.has(path)) {
    location.assign(`${url.pathname}${url.search}${url.hash}`);
    return;
  }
  history.replaceState({ ...(history.state || {}), scrollY: scrollY }, '', location.href);
  const next = `${path}${url.search}${url.hash}`;
  if (replace) history.replaceState({ scrollY: 0 }, '', next);
  else history.pushState({ scrollY: 0 }, '', next);
  render(true);
  requestAnimationFrame(() => {
    if (url.hash) scrollToElement(url.hash);
    else scrollTo(0, 0);
  });
}

async function importScore(file: File): Promise<void> {
  if (session && !confirm(`Import “${file.name}” and replace the plan for “${session.score.title}”? Export a backup first if you need it.`)) return;
  loading = true;
  errorMessage = '';
  render();
  await new Promise(resolve => setTimeout(resolve, 20));
  try {
    const score = await parseScoreFile(file);
    session = { score, partId: score.parts[0]?.id || '', lookahead: 4, current: 0, ranges: [] };
    persist();
    notice = `${score.title} is ready. Choose your part and mark a slice.`;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'The score could not be opened.';
  } finally {
    loading = false;
    render();
    if (!errorMessage) setTimeout(() => scrollToElement('#workspace'), 0);
  }
}

function addRange(form: HTMLFormElement): void {
  if (!session) return;
  const part = currentPart();
  if (!part) return;
  const data = new FormData(form);
  const start = Number(data.get('start'));
  const end = Number(data.get('end'));
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end >= part.measures.length) {
    errorMessage = `Choose an end measure at or after ${formatMeasure(part, Math.max(0, start))}.`;
    render();
    return;
  }
  const tempo = unlocked ? Number(data.get('tempo')) : 0;
  const range: RehearsalRange = { id: crypto.randomUUID(), start, end, label: String(data.get('label') || `Measures ${start + 1}–${end + 1}`), note: String(data.get('note') || ''), status: 'planned', ...(tempo ? { targetTempo: tempo } : {}) };
  session.ranges.push(range);
  persist();
  notice = `${range.label} added to the queue.`;
  errorMessage = '';
  render();
  document.querySelector(`[data-range-id="${CSS.escape(range.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function exportPlan(): void {
  if (!session) return;
  const blob = new Blob([JSON.stringify({ format: 'rehearsal-sightline/v1', exportedAt: new Date().toISOString(), ...session }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${session.score.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'rehearsal'}-sightline.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice = 'Plan backup exported.';
  render();
}

async function importPlan(file: File): Promise<void> {
  try {
    const value = JSON.parse(await file.text()) as SavedSession & { format?: string };
    if (value.format !== 'rehearsal-sightline/v1' || !value.score?.parts?.length || !Array.isArray(value.ranges)) throw new Error('not a plan');
    if (session && !confirm(`Replace “${session.score.title}” with the plan in “${file.name}”? `)) return;
    session = value;
    session.current = Math.max(0, session.current || 0);
    persist();
    notice = 'Plan backup restored.';
    render();
  } catch {
    errorMessage = 'That file is not a valid Rehearsal Sightline plan backup.';
    render();
  }
}

function bindInputs(): void {
  document.querySelectorAll<HTMLInputElement>('#score-file, #score-file-secondary, #replace-score-file').forEach(input => input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void importScore(file);
  }));
  document.querySelector<HTMLSelectElement>('#part-select')?.addEventListener('change', event => {
    if (!session) return;
    const select = event.target as HTMLSelectElement;
    const nextPart = session.score.parts.find(part => part.id === select.value);
    if (session.ranges.length && !confirm(`Switch to ${nextPart?.name || 'this part'} and clear the ${session.ranges.length} marked ${session.ranges.length === 1 ? 'slice' : 'slices'} for ${currentPart()?.name || 'the current part'}?`)) {
      select.value = session.partId;
      return;
    }
    session.partId = select.value;
    session.current = 0;
    session.ranges = [];
    persist();
    notice = 'Part changed; the rehearsal queue is ready for this part.';
    render();
  });
  document.querySelector<HTMLInputElement>('#position-range')?.addEventListener('input', event => {
    if (!session) return;
    playing = false;
    session.current = Number((event.target as HTMLInputElement).value);
    persist();
    render();
  });
  document.querySelector<HTMLInputElement>('#lookahead-range')?.addEventListener('input', event => {
    if (!session) return;
    session.lookahead = Number((event.target as HTMLInputElement).value);
    persist();
    render();
  });
  document.querySelector<HTMLFormElement>('#range-form')?.addEventListener('submit', event => {
    event.preventDefault();
    addRange(event.currentTarget as HTMLFormElement);
  });
  document.querySelector<HTMLInputElement>('#plan-file')?.addEventListener('change', event => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) void importPlan(file);
  });
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const token = String(form.get('license') || '').trim();
    if (!token) return;
    storeLicense(token);
    notice = 'Checking your license…';
    render();
    const result = await verifyLicense(true);
    unlocked = result.valid;
    notice = result.message;
    if (session && !unlocked && session.lookahead > 8) session.lookahead = 8;
    persist();
    render();
  });
}

app.addEventListener('change', event => {
  const target = event.target as HTMLElement;
  const card = target.closest<HTMLElement>('[data-range-id]');
  if (!session || !card) return;
  const range = session.ranges.find(item => item.id === card.dataset.rangeId);
  if (!range) return;
  if (target.matches('[data-action="range-status"]')) {
    range.status = (target as HTMLSelectElement).value as RehearsalRange['status'];
    persist();
    notice = `${range.label} marked ${range.status === 'needs-work' ? 'Needs work' : range.status === 'passed' ? 'Passed' : 'Planned'}.`;
    render();
    return;
  }
  if (target.matches('[data-action="range-note"]')) range.note = (target as HTMLTextAreaElement).value;
  persist();
});

app.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'reset-demo' && demoMode) {
    session = createDemoSession();
    saveSession(session, true);
    notice = 'Demo reset to the four sample slices.';
    render();
    scrollToElement('#workspace');
    return;
  }
  if (action === 'start-real' && demoMode) {
    clearSession(true);
    navigate('/');
    return;
  }
  const part = currentPart();
  if (action === 'toggle-more') {
    const menu = document.querySelector<HTMLElement>('#more-menu');
    if (menu) {
      menu.hidden = !menu.hidden;
      target.setAttribute('aria-expanded', String(!menu.hidden));
    }
    return;
  }
  if (action === 'print') {
    window.print();
    return;
  }
  if (action === 'export-json') {
    exportPlan();
    return;
  }
  if (action === 'clear-session' && session && confirm(`Remove “${session.score.title}” and all its rehearsal notes from this device? This cannot be undone.`)) {
    clearSession(demoMode);
    session = demoMode ? createDemoSession() : null;
    if (demoMode && session) saveSession(session, true);
    playing = false;
    notice = demoMode ? 'Demo reset to the sample score.' : 'Score and plan removed from this device.';
    render();
    return;
  }
  if (!session || !part) return;
  if (action === 'toggle-play') {
    playing = !playing;
    playStarted = performance.now();
    notice = playing ? 'Rehearsal clock started.' : 'Rehearsal clock paused.';
    render();
    return;
  }
  if (action === 'previous') {
    playing = false;
    session.current = Math.max(0, session.current - 1);
    persist();
    render();
    return;
  }
  if (action === 'next') {
    playing = false;
    session.current = Math.min(part.measures.length - 1, session.current + 1);
    persist();
    render();
    return;
  }
  const card = target.closest<HTMLElement>('[data-range-id]');
  const rangeIndex = card ? session.ranges.findIndex(item => item.id === card.dataset.rangeId) : -1;
  const range = rangeIndex >= 0 ? session.ranges[rangeIndex] : undefined;
  if (action === 'load-range' && range) {
    session.current = range.start;
    playing = false;
    persist();
    render();
    scrollToElement('.score-strip');
  }
  if (action === 'delete-range' && range && confirm(`Remove “${range.label}” from the rehearsal queue?`)) {
    lastDeleted = range;
    session.ranges.splice(rangeIndex, 1);
    persist();
    notice = `${range.label} removed.`;
    render();
  }
  if (action === 'undo-delete' && lastDeleted) {
    session.ranges.push(lastDeleted);
    notice = `${lastDeleted.label} restored.`;
    lastDeleted = null;
    persist();
    render();
  }
});

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
  if (!link || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href, location.origin);
  if (url.origin !== location.origin) return;
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (!APP_ROUTES.has(path) || url.href === location.href) return;
  event.preventDefault();
  navigate(`${url.pathname}${url.search}${url.hash}`);
});

document.addEventListener('keydown', event => {
  const path = pathFromLocation();
  if (!session || (path !== '/' && path !== '/demo')) return;
  const element = event.target as HTMLElement;
  if (element.matches('input, textarea, select, button, a, summary') || element.isContentEditable) return;
  const part = currentPart();
  if (!part) return;
  if (event.code === 'Space') {
    event.preventDefault();
    playing = !playing;
    playStarted = performance.now();
    render();
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    playing = false;
    const step = event.shiftKey ? 4 : 1;
    session.current = Math.max(0, Math.min(part.measures.length - 1, session.current + (event.key === 'ArrowRight' ? step : -step)));
    persist();
    render();
  }
  if (event.key.toLowerCase() === 'l') {
    const end = Math.min(part.measures.length - 1, session.current + Math.max(1, Math.min(4, session.lookahead)) - 1);
    session.ranges.push({ id: crypto.randomUUID(), start: session.current, end, label: `Measures ${formatMeasure(part, session.current)}–${formatMeasure(part, end)}`, note: '', status: 'planned' });
    persist();
    notice = 'Visible slice added. Press Tab to reach its note field.';
    render();
  }
});

window.addEventListener('popstate', () => {
  render(true);
  requestAnimationFrame(() => scrollTo(0, Number(history.state?.scrollY || 0)));
});

setInterval(() => {
  if (!playing || !session) return;
  const part = currentPart();
  const measure = part?.measures[session.current];
  if (!part || !measure) return;
  const duration = measure.beats * (4 / measure.beatType) * (60_000 / Math.max(measure.tempo, 20));
  if (performance.now() - playStarted >= duration) {
    if (session.current >= part.measures.length - 1) {
      playing = false;
      notice = 'End of the part.';
    } else {
      session.current += 1;
      playStarted = performance.now();
      persist();
    }
    render();
  }
}, 200);

window.addEventListener('online', () => {
  document.querySelectorAll<HTMLElement>('[data-online]').forEach(element => { element.textContent = 'Private · on device'; });
  void reconcileLicense();
});
window.addEventListener('offline', () => document.querySelectorAll<HTMLElement>('[data-online]').forEach(element => { element.textContent = 'Offline · ready'; }));

async function reconcileLicense(showResult = false): Promise<void> {
  if (!hasLicenseToken()) return;
  const result = await verifyLicense();
  const changed = unlocked !== result.valid;
  unlocked = result.valid;
  if (changed || showResult) {
    notice = result.message;
    if (session && !unlocked && session.lookahead > 8) {
      session.lookahead = 8;
      persist();
    }
    render();
  }
}

const captured = captureLicenseFromUrl();
if (captured) notice = 'License received. Verifying your Studio unlock…';
render();
void reconcileLicense(captured);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
