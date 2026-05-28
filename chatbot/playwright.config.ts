import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — anti-phantom-wiring harness.
 *
 * #65 (audit P1.1): default to a FRESH server. Reusing a running server can test
 * stale code — or even the wrong app, since port 3000 is another local project.
 * So we run on a dedicated port and only reuse when PW_REUSE_SERVER=true is set
 * explicitly. global-setup logs the commit under test for provenance.
 */
const PORT = Number(process.env.PW_PORT ?? 3201);
const BASE_URL = `http://localhost:${PORT}`;
const REUSE = process.env.PW_REUSE_SERVER === 'true';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: REUSE,
    timeout: 120_000,
    // Deterministic provider for e2e — no live claude / no paid calls.
    env: { LLM_PROVIDER: 'mock' },
  },
});
