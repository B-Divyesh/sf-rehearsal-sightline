import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';

const scorePath = path.join(process.cwd(), 'tests/fixtures/rehearsal.musicxml');

function relativeLuminance(rgb: string): number {
  const channels = rgb.match(/\d+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Expected an RGB color, received ${rgb}`);
  const linear = channels.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrastRatio(first: string, second: string): number {
  const [a, b] = [relativeLuminance(first), relativeLuminance(second)].sort((left, right) => right - left);
  return (a + 0.05) / (b + 0.05);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('imports MusicXML, builds a rehearsal queue, and persists it locally', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await expect(page).toHaveTitle(/Rehearsal Sightline/);
  await expect(page.locator('h1')).toHaveCount(1);
  await page.locator('#score-file').setInputFiles(scorePath);
  await expect(page.getByRole('heading', { name: 'North Window Study' })).toBeVisible();
  await expect(page.locator('#part-select')).toHaveValue('P1');
  await expect(page.locator('.measure-tile')).toHaveCount(5);
  await page.getByRole('button', { name: /Add to rehearsal queue/ }).click();
  await expect(page.locator('.range-card')).toHaveCount(1);
  await page.locator('[data-action="range-note"]').fill('Breathe before the ascent');
  await page.locator('[data-action="range-note"]').blur();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Player note', exact: true })).toHaveValue('Breathe before the ascent');
  await expect(page.getByRole('button', { name: /Print cue sheet/ })).toBeEnabled();
  await page.screenshot({ path: `test-results/workspace-${testInfo.project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('has no serious accessibility violations on empty and populated states', async ({ page }) => {
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await page.locator('#score-file').setInputFiles(scorePath);
  await expect(page.locator('.workspace')).toBeVisible();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('legal routes work directly and preserve a single main heading', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy, without a backstage.');
  await expect(page.locator('main')).toHaveCount(1);
  await page.goto('/terms');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bring your own score. Keep your rights.');
});

test('supports the score keyboard path without trapping focus', async ({ page }) => {
  await page.locator('#score-file').setInputFiles(scorePath);
  // Score shortcuts intentionally do not run while a form field owns focus.
  // Move to the reading surface, as a keyboard-only player would, before
  // exercising the document-level commands.
  await page.locator('body').focus();
  await page.locator('body').press('ArrowRight');
  await expect(page.locator('.position strong')).toHaveText('2');
  await page.locator('body').press('l');
  await expect(page.locator('.range-card')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});

test('updates rehearsal result feedback immediately and persists it', async ({ page }) => {
  await page.locator('#score-file').setInputFiles(scorePath);
  await page.getByRole('button', { name: /Add to rehearsal queue/ }).click();

  await page.getByRole('combobox', { name: /Result for Measures 1–4/ }).selectOption('passed');
  await expect(page.locator('.status-stamp')).toHaveText('Passed');
  await expect(page.locator('.section-title > span')).toHaveText('1 passed');
  await expect(page.locator('#live-region')).toContainText('marked Passed');

  await page.reload();
  await expect(page.locator('.status-stamp')).toHaveText('Passed');
  await expect(page.locator('.section-title > span')).toHaveText('1 passed');
});

test('reports an invalid returned license after its verification completes', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  try {
    await page.route(/https:\/\/api\.sociobot\.in\/api\/v1\/products\/rehearsal-sightline\/verify\?license=qa-invalid-token$/, route => route.fulfill({
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4173' },
      body: JSON.stringify({ valid: false, reason: 'invalid' }),
    }));

    await page.goto('/?license=qa-invalid-token');
    await expect(page.locator('#live-region')).toHaveText(/License no longer active/);
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('sb_license:rehearsal-sightline'))).toBe('qa-invalid-token');
  } finally {
    await context.close();
  }
});

test('keeps keyboard focus indicators above 3:1 on light and cobalt controls', async ({ page }) => {
  const footerLink = page.getByLabel('Legal').getByRole('link', { name: 'Privacy' });
  await footerLink.focus();
  const lightFocus = await footerLink.evaluate(element => ({
    focused: element.matches(':focus-visible'),
    outline: getComputedStyle(element).outlineColor,
    surface: getComputedStyle(document.body).backgroundColor,
  }));
  expect(lightFocus.focused).toBe(true);
  expect(contrastRatio(lightFocus.outline, lightFocus.surface)).toBeGreaterThanOrEqual(3);

  await page.locator('#score-file').setInputFiles(scorePath);
  const primaryButton = page.getByRole('button', { name: /Add to rehearsal queue/ });
  await primaryButton.focus();
  const primaryFocus = await primaryButton.evaluate(element => ({
    focused: element.matches(':focus-visible'),
    outline: getComputedStyle(element).outlineColor,
    surface: getComputedStyle(element).backgroundColor,
  }));
  expect(primaryFocus.focused).toBe(true);
  expect(contrastRatio(primaryFocus.outline, primaryFocus.surface)).toBeGreaterThanOrEqual(3);
});
