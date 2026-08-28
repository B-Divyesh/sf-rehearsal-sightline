// @vitest-environment node
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { writeReleaseWorker } from './release-worker';

const directories: string[] = [];

async function fixture(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'sightline-worker-'));
  directories.push(directory);
  await mkdir(join(directory, 'assets'));
  await Promise.all([
    writeFile(join(directory, 'index.html'), '<!doctype html><title>Rehearsal Sightline</title>'),
    writeFile(join(directory, 'mark.svg'), '<svg/>'),
    writeFile(join(directory, 'manifest.webmanifest'), '{"name":"Sightline"}'),
    writeFile(join(directory, 'assets', 'app.js'), 'console.log("ready")'),
  ]);
  return directory;
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

describe('release service worker', () => {
  it('is byte-identical for identical precache bytes and changes only with the shell', async () => {
    const first = await fixture();
    const second = await fixture();

    const [firstCache, secondCache] = await Promise.all([writeReleaseWorker(first), writeReleaseWorker(second)]);
    expect(firstCache).toBe(secondCache);
    await expect(readFile(join(first, 'sw.js'), 'utf8')).resolves.toBe(await readFile(join(second, 'sw.js'), 'utf8'));

    await writeFile(join(second, 'assets', 'app.js'), 'console.log("updated")');
    const changedCache = await writeReleaseWorker(second);
    expect(changedCache).not.toBe(firstCache);
  });
});
