import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import { writeReleaseWorker } from './src/release-worker.ts';

function releaseWorker(): Plugin {
  return {
    name: 'release-versioned-service-worker',
    async closeBundle() {
      await writeReleaseWorker(resolve(process.cwd(), 'dist'));
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
