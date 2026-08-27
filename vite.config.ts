import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    target: 'es2022',
    cssMinify: true,
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
  },
});
