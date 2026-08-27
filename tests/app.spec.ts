import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';

const scorePath = path.join(process.cwd(), 'tests/fixtures/rehearsal.musicxml');

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
  await page.locator('body').press('ArrowRight');
  await expect(page.locator('.position strong')).toHaveText('2');
  await page.locator('body').press('l');
  await expect(page.locator('.range-card')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
