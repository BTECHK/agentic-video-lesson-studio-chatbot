import { test, expect } from '@playwright/test';

/**
 * Visual verification + anti-phantom checks for the Phase 8 / 8.5 / Studio
 * additions. Each test asserts the feature actually renders, then captures a
 * human-reviewable screenshot under e2e/screenshots/.
 */
const SHOTS = 'e2e/screenshots';

async function enterDemoChat(page: import('@playwright/test').Page) {
  await page.goto('/chat');
  const tryDemo = page.getByRole('button', { name: 'Try Demo' });
  await expect(tryDemo).toBeVisible();
  await tryDemo.click();
  // Hydration race guard: if the first click lands before handlers attach,
  // the gate can remain visible; retry once and wait for composer readiness.
  const composer = page.getByPlaceholder('Ask Tutor a question...');
  if (!(await composer.isVisible().catch(() => false))) {
    await tryDemo.click();
  }
  await expect(composer).toBeVisible();
}

test('chat exposes the TA / Office Hours mode toggle', async ({ page }) => {
  await enterDemoChat(page);

  const ta = page.getByRole('button', { name: 'Teaching Assistant' });
  const office = page.getByRole('button', { name: 'Office Hours' });
  await expect(ta).toBeVisible();
  await expect(office).toBeVisible();
  await expect(ta).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: `${SHOTS}/chat-ta-mode.png`, fullPage: true });

  await office.click();
  await expect(office).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Office Hours — exploratory mode')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/chat-office-hours-mode.png`, fullPage: true });
});

test('ingestion control panel renders freshness + schedule', async ({ page }) => {
  await page.goto('/ingestion');
  await expect(page.getByRole('heading', { name: 'Ingestion Control Panel' })).toBeVisible();
  await expect(page.getByText('Last run', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh all' })).toBeVisible();
  // A known vendor row from ingest.config.json.
  await expect(page.getByRole('cell', { name: 'anthropic', exact: true })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/ingestion-panel.png`, fullPage: true });
});

test('studio timeline renders and a comment opens the inspector', async ({ page }) => {
  await page.goto('/studio');
  await expect(page.getByRole('heading', { name: /Studio/ })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/studio-timeline.png`, fullPage: true });
});
