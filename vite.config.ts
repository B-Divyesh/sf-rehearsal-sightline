import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import { writeReleaseWorker } from './src/release-worker.ts';

type StaticRoute = { title: string; description: string };

const staticRoutes: Record<string, StaticRoute> = {
  demo: {
    title: 'Demo — Rehearsal Sightline',
    description: 'Try a populated MusicXML rehearsal plan. Demo notes stay separate from your own score plan.',
  },
  privacy: {
    title: 'Privacy — Rehearsal Sightline',
    description: 'Read how Rehearsal Sightline keeps MusicXML scores and rehearsal plans in your browser.',
  },
  terms: {
    title: 'Terms — Rehearsal Sightline',
    description: 'Read the terms for using Rehearsal Sightline with MusicXML scores you are allowed to use.',
  },
  'privacy-request': {
    title: 'Request purchase data — Rehearsal Sightline',
    description: 'Find out how to request purchase or license data handled by the merchant for Rehearsal Sightline.',
  },
};

function routeDocument(index: string, route: string, details: StaticRoute): string {
  const canonical = `https://rehearsal-sightline.sociobot.in/${route}`;
  return index
    .replace(/<title>[^<]*<\/title>/, `<title>${details.title}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${details.description}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${details.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${details.description}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${details.title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${details.description}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`);
}

function productArtifacts(): Plugin {
  return {
    name: 'rehearsal-sightline-product-artifacts',
    async closeBundle() {
      const output = resolve(process.cwd(), 'dist');
      const index = await readFile(join(output, 'index.html'), 'utf8');
      await Promise.all(Object.entries(staticRoutes).map(async ([route, details]) => {
        const directory = join(output, route);
        await mkdir(directory, { recursive: true });
        await writeFile(join(directory, 'index.html'), routeDocument(index, route, details));
      }));
      await writeReleaseWorker(output);
    },
  };
}

export default defineConfig({
  plugins: [productArtifacts()],
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
