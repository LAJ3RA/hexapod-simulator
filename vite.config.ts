import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative Pfade, damit die Seite auch unter https://<name>.github.io/<repo>/ funktioniert
  base: './',
  build: {
    // three.js ist groß – Warnung erst ab 1 MB
    chunkSizeWarningLimit: 1000,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});