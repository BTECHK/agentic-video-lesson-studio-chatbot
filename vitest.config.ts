import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 30000,
    reporters: ['default', 'json'],
    outputFile: {
      json: '.test-results/results.json',
    },
  },
});
