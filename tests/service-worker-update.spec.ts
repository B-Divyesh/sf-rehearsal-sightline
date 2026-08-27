import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, normalize, relative } from 'node:path';

type ReleaseServer = {
  origin: string;
  use: (directory: string) => void;
  close: () => Promise<void>;
};

const contentTypes: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
};

function workerCacheName(worker: string): string {
  const match = worker.match(/const CACHE = ["'](sightline-[a-f0-9]+)["'];/);
  if (!match?.[1]) throw new Error('Expected a build-versioned Sightline service-worker cache.');
  return match[1];
}

async function makeRelease(base: string, marker: string, oldCacheName?: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'sightline-release-'));
  await cp(base, directory, { recursive: true });
  const indexPath = join(directory, 'index.html');
  await writeFile(indexPath, (await readFile(indexPath, 'utf8')).replace('</head>', `<meta name="test-release" content="${marker}"></head>`));
  if (oldCacheName) {
    const workerPath = join(directory, 'sw.js');
    await writeFile(workerPath, (await readFile(workerPath, 'utf8')).replace(/const CACHE = ["']sightline-[a-f0-9]+["'];/, `const CACHE = '${oldCacheName}';`));
  }
  return directory;
}

async function startReleaseServer(initialDirectory: string): Promise<ReleaseServer> {
  let activeDirectory = initialDirectory;
  const server: Server = createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filename = normalize(join(activeDirectory, requested));
    if (relative(activeDirectory, filename).startsWith('..')) {
      response.writeHead(400).end();
      return;
    }
    try {
      const body = await readFile(filename);
      const extension = filename.slice(filename.lastIndexOf('.'));
      response.writeHead(200, {
        'Cache-Control': pathname === '/sw.js' ? 'no-cache' : 'no-store',
        'Content-Type': contentTypes[extension] || 'application/octet-stream',
      }).end(body);
    } catch {
      if (pathname.includes('.')) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': 'text/html' }).end(await readFile(join(activeDirectory, 'index.html')));
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Unable to start test release server.');
  return {
    origin: `http://127.0.0.1:${address.port}`,
    use: directory => { activeDirectory = directory; },
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

test('an old controlled client receives a new release and still reloads offline', async ({ page, context }) => {
  const currentWorker = await readFile('dist/sw.js', 'utf8');
  const currentCache = workerCacheName(currentWorker);
  const oldCache = 'sightline-0000000000000000';
  const oldRelease = await makeRelease('dist', 'old', oldCache);
  const newRelease = await makeRelease('dist', 'new');
  const server = await startReleaseServer(oldRelease);

  try {
    await page.goto(server.origin);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'old');
    await expect.poll(() => page.evaluate(() => caches.keys())).toContain(oldCache);

    server.use(newRelease);
    await page.reload();
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'new');
    await expect.poll(() => page.evaluate(() => caches.keys())).toEqual([currentCache]);

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'new');
  } finally {
    await context.setOffline(false);
    await server.close();
    await rm(oldRelease, { recursive: true, force: true });
    await rm(newRelease, { recursive: true, force: true });
  }
});
