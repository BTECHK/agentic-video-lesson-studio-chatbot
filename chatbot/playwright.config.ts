import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config (H0 item 6) — the anti-phantom-wiring harness.
 * One smoke test today; grow one real per-feature test as each chain is wired
 * (e.g. "a question actually hits RAG" once CHAT-01/02 are real).
 * Boots the Next dev server and drives Chromium against it.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
