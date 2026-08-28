import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const CACHE_PREFIX = 'sightline-';

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }));
  return files.flat();
}

function toPublicPath(outputDirectory: string, file: string): string {
  return `/${relative(outputDirectory, file).replaceAll('\\', '/')}`;
}

function isPrecacheFile(outputDirectory: string, file: string): boolean {
  const filename = relative(outputDirectory, file).replaceAll('\\', '/');
  return filename === 'index.html'
    || filename === 'mark.svg'
    || filename === 'manifest.webmanifest'
    || filename.startsWith('assets/');
}

/**
 * Write the offline worker from the exact shell it caches. This revision must
 * be reproducible: release identity is established by the output bytes, not
 * by build time or another environmental value.
 */
export async function writeReleaseWorker(outputDirectory: string): Promise<string> {
  const outputFiles = (await filesBelow(outputDirectory)).sort();
  const precacheFiles = outputFiles.filter(file => isPrecacheFile(outputDirectory, file));
  const revision = createHash('sha256');

  for (const file of precacheFiles) {
    revision.update(toPublicPath(outputDirectory, file));
    revision.update('\0');
    revision.update(await readFile(file));
    revision.update('\0');
  }

  const cacheName = `${CACHE_PREFIX}${revision.digest('hex').slice(0, 16)}`;
  const shell = ['/', ...precacheFiles.map(file => toPublicPath(outputDirectory, file))];
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
  return cacheName;
}
