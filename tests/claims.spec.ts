import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { strToU8, zipSync } from 'fflate';

const scorePath = path.join(process.cwd(), 'tests/fixtures/rehearsal.musicxml');
const demoSessionKey = 'demo:rehearsal-sightline:session:v1';

async function openMore(page: import('@playwright/test').Page): Promise<void> {
  await page.getByRole('button', { name: /More/ }).click();
  await expect(page.getByRole('button', { name: 'Export plan backup' })).toBeVisible();
}

test.beforeEach(async ({ page }, testInfo) => {
  if (/@claim:(local-privacy|offline-reload|studio-license|license-cache)/.test(testInfo.title)) return;
  await page.goto('/demo');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
});

test('@claim:demo-sandbox Try a populated sample without changing your own plan', async ({ page }) => {
  const realPlan = JSON.stringify({ score: { title: 'Own score', parts: [] }, partId: '', lookahead: 4, current: 0, ranges: [] });
  await page.goto('/');
  await page.evaluate(value => localStorage.setItem('rehearsal-sightline:session:v1', value), realPlan);

  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
  await expect(page.locator('.range-card')).toHaveCount(4);
  await expect(page.locator('[data-demo-banner]')).toContainText('Demo — sample data, nothing is saved');

  await page.locator('[name="label"]').fill('A temporary demo slice');
  await page.getByRole('button', { name: /Add to rehearsal queue/ }).click();
  await expect(page.locator('.range-card')).toHaveCount(5);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.range-card')).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('rehearsal-sightline:session:v1'))).toBe(realPlan);

  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('rehearsal-sightline:session:v1'))).toBe(realPlan);
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), demoSessionKey)).toBeNull();
});

test('@claim:musicxml-import Import MusicXML, XML, or MXL files up to 25 MB', async ({ page }) => {
  const xml = await readFile(scorePath, 'utf8');
  const mxl = zipSync({ 'META-INF/container.xml': strToU8('<container/>'), 'north-window.musicxml': strToU8(xml) });

  page.once('dialog', dialog => dialog.accept());
  await page.locator('#score-file').setInputFiles({ name: 'north-window.mxl', mimeType: 'application/octet-stream', buffer: Buffer.from(mxl) });
  await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
  await expect(page.locator('#part-select')).toHaveValue('P1');

  page.once('dialog', dialog => dialog.accept());
  await page.locator('#score-file').setInputFiles({ name: 'too-large.xml', mimeType: 'application/xml', buffer: Buffer.alloc((25 * 1024 * 1024) + 1) });
  await expect(page.locator('#live-region')).toContainText('over 25 MB');

  page.once('dialog', dialog => dialog.accept());
  await page.locator('#score-file').setInputFiles({ name: 'recovered.xml', mimeType: 'application/xml', buffer: Buffer.from(xml) });
  await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
});

test('@claim:local-privacy Keep scores in the browser during free use', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  try {
    await page.goto('/demo');
    await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
    await page.locator('[name="label"]').fill('Private sample change');
    await page.getByRole('button', { name: /Add to rehearsal queue/ }).click();

    expect(requests).not.toEqual([]);
    expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
    await expect.poll(() => page.evaluate(() => ({
      real: localStorage.getItem('rehearsal-sightline:session:v1'),
      demo: localStorage.getItem('demo:rehearsal-sightline:session:v1'),
    }))).toEqual({ real: null, demo: expect.any(String) });
  } finally {
    await context.close();
  }
});

test('@claim:part-choice Choose the score part for the rehearsal queue', async ({ page }) => {
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#part-select').selectOption('P2');
  await expect(page.locator('#part-select')).toHaveValue('P2');
  await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
  await expect(page.locator('.workspace-heading')).toContainText('2 measures');
  await expect(page.locator('.range-card')).toHaveCount(0);
});

test('@claim:lookahead Set the free sightline to eight measures', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to Opening shape' }).click();
  await page.locator('#lookahead-range').fill('8');
  await expect(page.locator('.measure-tile')).toHaveCount(8);
  await expect(page.locator('.sightline-key')).toContainText('8 measures');
});

test('@claim:keyboard-stepping Step through measures with the keyboard', async ({ page }) => {
  await page.locator('body').focus();
  await page.locator('body').press('ArrowRight');
  await expect(page.locator('.position strong')).toHaveText('4');
  await page.locator('body').press('Shift+ArrowRight');
  await expect(page.locator('.position strong')).toHaveText('8');
});

test('@claim:range-notes Mark a range with a name, note, and result', async ({ page }) => {
  await page.locator('[name="label"]').fill('Closing check');
  await page.locator('[name="note"]').fill('Keep the release together.');
  await page.getByRole('button', { name: /Add to rehearsal queue/ }).click();
  await expect(page.getByRole('button', { name: 'Go to Closing check' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Result for Closing check' }).selectOption('passed');
  await expect(page.locator('[data-range-id]').filter({ hasText: 'Closing check' }).locator('.status-stamp')).toHaveText('Passed');
  await expect(page.locator('[data-range-id]').filter({ hasText: 'Closing check' }).getByRole('textbox', { name: 'Player note' })).toHaveValue('Keep the release together.');
});

test('@claim:print-cue-sheet Print a populated cue sheet', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-sheet')).toBeVisible();
  await expect(page.locator('.print-sheet li')).toHaveCount(4);
  await expect(page.locator('.print-sheet')).toContainText('Rehearsal A lift');
});

test('@claim:plan-backup Export and import a portable plan backup', async ({ page }) => {
  await openMore(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export plan backup' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Expected plan backup download path.');
  const exported = JSON.parse(await readFile(downloadPath, 'utf8')) as { format: string; ranges: unknown[] };
  expect(exported.format).toBe('rehearsal-sightline/v1');
  expect(exported.ranges).toHaveLength(4);

  await openMore(page);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#plan-file').setInputFiles(downloadPath);
  await expect(page.locator('.range-card')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
});

test('@claim:browser-restore Keep a demo plan until it is reset', async ({ page }) => {
  await page.locator('[name="label"]').fill('Saved demo slice');
  await page.getByRole('button', { name: /Add to rehearsal queue/ }).click();
  await expect(page.locator('.range-card')).toHaveCount(5);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Go to Saved demo slice' })).toBeVisible();
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), demoSessionKey)).not.toBeNull();
});

test('@claim:offline-reload Work offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('/demo');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
    await page.waitForFunction(async () => {
      const script = document.querySelector<HTMLScriptElement>('script[type="module"]')?.src;
      return Boolean(await caches.match('/index.html')) && Boolean(script && await caches.match(script));
    });
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('h1#page-title')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:free-core Use planning, cue sheets, and backups without a Studio license', async ({ page }) => {
  await expect(page.locator('[name="tempo"]')).toBeDisabled();
  await page.locator('[name="label"]').fill('Free planning slice');
  await page.getByRole('button', { name: /Add to rehearsal queue/ }).click();
  await expect(page.getByRole('button', { name: /Print cue sheet/ })).toBeEnabled();
  await openMore(page);
  await expect(page.getByRole('button', { name: 'Export plan backup' })).toBeEnabled();
});

test('@claim:studio-license Restore a Studio license on another device', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto('/demo');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.route(/https:\/\/api\.sociobot\.in\/api\/v1\/products\/rehearsal-sightline\/verify/, route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok' }),
  }));
  try {
    await page.locator('summary').click();
    await page.getByRole('textbox', { name: 'License token' }).fill('demo-license-token');
    await page.getByRole('button', { name: 'Verify license' }).click();
    await expect(page.locator('.license-active')).toBeVisible();
    await expect(page.locator('#lookahead-range')).toHaveAttribute('max', '16');
    await expect(page.locator('[name="tempo"]')).toBeEnabled();
    await expect.poll(() => page.evaluate(() => ({
      real: localStorage.getItem('sb_license:rehearsal-sightline'),
      demo: localStorage.getItem('demo:sb_license:rehearsal-sightline'),
    }))).toEqual({ real: null, demo: 'demo-license-token' });
  } finally {
    await context.close();
  }
});

test('@claim:license-cache Check a Studio license at most once per day', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto('/demo');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  let checks = 0;
  await page.route(/https:\/\/api\.sociobot\.in\/api\/v1\/products\/rehearsal-sightline\/verify/, route => {
    checks += 1;
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) });
  });
  try {
    await page.locator('summary').click();
    await page.getByRole('textbox', { name: 'License token' }).fill('cached-demo-license');
    await page.getByRole('button', { name: 'Verify license' }).click();
    await expect(page.locator('.license-active')).toBeVisible();
    expect(checks).toBe(1);

    await page.reload();
    await expect(page.locator('.license-active')).toBeVisible();
    expect(checks).toBe(1);

    await page.evaluate(() => {
      const key = 'demo:sb_license_verdict:rehearsal-sightline';
      const value = JSON.parse(localStorage.getItem(key) || '{}') as { checkedAt?: number };
      value.checkedAt = Date.now() - 86_400_001;
      localStorage.setItem(key, JSON.stringify(value));
    });
    await page.reload();
    await expect.poll(() => checks).toBe(2);
  } finally {
    await context.close();
  }
});

test('@claim:studio-pending Avoid a broken checkout while Studio registration is pending', async ({ page }) => {
  const apiRequests: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).origin === 'https://api.sociobot.in') apiRequests.push(request.url());
  });
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await expect(page.locator('.billing-pending')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verify license' })).toHaveCount(0);
  expect(apiRequests).toEqual([]);
});
