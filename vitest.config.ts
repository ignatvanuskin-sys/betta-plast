import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // The DB-backed integration tests share one PGlite instance per file.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
