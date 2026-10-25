// Unit tests (npm test) for the app's pure logic: which session is next, money and dates.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: { include: ['lib/**/*.test.ts'] },
});
