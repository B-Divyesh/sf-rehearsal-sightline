import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';

const CACHE_PREFIX = 'sightline-';

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }));
  return files.flat();
}

function releaseWorker(): Plugin {
  return {
    name: 'release-versioned-service-worker',
    async closeBundle() {
      const outputDirectory = resolve(process.cwd(), 'dist');
      const outputFiles = (await filesBelow(outputDirectory)).sort();
      const precacheFiles = outputFiles.filter(file => {
        const filename = relative(outputDirectory, file).replaceAll('\\', '/');
        return filename === 'index.html'
          || filename === 'mark.svg'
          || filename === 'manifest.webmanifest'
          || filename.startsWith('assets/');
      });
      const revision = createHash('sha256');
      for (const file of precacheFiles) {
        revision.update(relative(outputDirectory, file));
        revision.update(await readFile(file));
      }
      // A release nonce also refreshes a worker-only change or a deliberately
      // repeated deploy whose asset bytes happen to match the prior build.
      revision.update(String(Date.now()));
      const cacheName = `${CACHE_PREFIX}${revision.digest('hex').slice(0, 16)}`;
      const shell = ['/', ...precacheFiles.map(file => `/${relative(outputDirectory, file).replaceAll('\\', '/')}`)];
      const worker = `const CACHE = ${JSON.stringify(cacheName)};
const CACHE_PREFIX = ${JSON.stringify(CACHE_PREFIX)};
const SHELL = ${JSON.stringify(shell)};

self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()),
));

self.addEventListener('activate', event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()),
));

function cacheResponse(request, response, event) {
  if (response.ok && new URL(request.url).origin === location.origin) {
    event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, response.clone())));
  }
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request)
      .then(response => cacheResponse(request, response, event))
      .catch(() => caches.match('/index.html')));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request)
    .then(response => cacheResponse(request, response, event))));
});
`;
      await writeFile(join(outputDirectory, 'sw.js'), worker);
    },
  };
}

export default defineConfig({
  plugins: [releaseWorker()],
  build: {
    target: 'es2022',
    cssMinify: true,
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
