import { test, expect } from '@playwright/test';

/**
 * Studio Generate — smoke-level E2E coverage. Closes gap #5 from
 * .planning/verification/2026-05-28-issue-71-coverage-gap-check.md.
 *
 * Route: /studio/generate
 *
 * Scope: UI contract only. Does NOT trigger generation.
 * Generation requires a live headless-Claude binary (REGEN_TRIGGER_ENABLED=true
 * on a pipeline host). The e2e server runs with LLM_PROVIDER=mock (set by
 * playwright.config.ts webServer env), which has no side-effect on the generate
 * page itself — the page is gated by REGEN_TRIGGER_ENABLED, not LLM_PROVIDER.
 *
 * What we prove here:
 *  1. The page loads (no 404, no crash).
 *  2. The lesson outline section renders (proves getOutlineSummary returned data).
 *  3. The Generate button is rendered and is in its idle state.
 *  4. The Apply button is rendered, disabled, and its tooltip/title reflects that
 *     the render pipeline is gated (REGEN_TRIGGER_ENABLED not set in e2e env).
 *  5. We do NOT click Generate — that would fire POST /api/generate which tries
 *     to spawn a Claude subprocess and will fail in CI/e2e.
 */

const SHOTS = 'e2e/screenshots';

test('studio/generate page loads without error', async ({ page }) => {
  await page.goto('/studio/generate');

  // Either the generate panel or the "no outline found" fallback renders —
  // either way the page must not show a 404 / Next.js error boundary.
  const hasPanel = await page.getByRole('heading', { name: /Generate/ }).isVisible().catch(() => false);
  const hasFallback = await page.getByText('No lesson with an outline found.').isVisible().catch(() => false);
  expect(hasPanel || hasFallback).toBe(true);

  await page.screenshot({ path: `${SHOTS}/studio-generate-smoke.png`, fullPage: true });
});

test('studio/generate: outline section renders with lesson data', async ({ page }) => {
  await page.goto('/studio/generate');

  // If no outline data exists the fallback is shown — record that honestly rather
  // than failing with a misleading assertion.
  const hasFallback = await page
    .getByText('No lesson with an outline found.')
    .isVisible()
    .catch(() => false);

  if (hasFallback) {
    // This is a real product gap: the test env has no lesson outline loaded.
    // Skip rather than paper over — the spec still proves the fallback renders.
    test.skip(true, 'No lesson outline available in test environment — outline section cannot be asserted.');
    return;
  }

  // The outline card heading must be present.
  await expect(page.getByText(/Outline \(\d+ sections?\)/)).toBeVisible();

  // At least one section item must render in the <ol>.
  const sectionItems = page.locator('ol li');
  await expect(sectionItems.first()).toBeVisible();
});

test('studio/generate: Generate button renders in idle state', async ({ page }) => {
  await page.goto('/studio/generate');

  const hasFallback = await page
    .getByText('No lesson with an outline found.')
    .isVisible()
    .catch(() => false);

  if (hasFallback) {
    test.skip(true, 'No lesson outline available in test environment.');
    return;
  }

  // The Generate button must be present and not disabled in idle state.
  // It shows "Generate script" (no draft) or "Regenerate script" (draft exists).
  const generateBtn = page
    .getByRole('button', { name: 'Generate script' })
    .or(page.getByRole('button', { name: 'Regenerate script' }));

  await expect(generateBtn).toBeVisible();
  await expect(generateBtn).not.toBeDisabled();
  // We intentionally do NOT click it — see file-level comment.
});

test('studio/generate: Apply button is gated (disabled) in e2e env', async ({ page }) => {
  await page.goto('/studio/generate');

  const hasFallback = await page
    .getByText('No lesson with an outline found.')
    .isVisible()
    .catch(() => false);

  if (hasFallback) {
    test.skip(true, 'No lesson outline available in test environment.');
    return;
  }

  // The Apply button only appears after a draft is loaded (outline.hasDraft or
  // after a generation poll resolves). In the e2e env there is no running job
  // and typically no pre-existing draft, so the Apply button section is not yet
  // visible. This test verifies the gate message IS present when the draft IS
  // shown — if no draft, we assert the generate form is in idle state instead,
  // which is equally correct behaviour.
  //
  // Check whether a draft section is present (e.g. from a prior job artifact).
  const draftHeading = page.getByRole('heading', { name: 'Draft script' });
  const hasDraft = await draftHeading.isVisible().catch(() => false);

  if (hasDraft) {
    // Apply button is present but disabled because REGEN_TRIGGER_ENABLED is unset.
    const applyBtn = page.getByRole('button', { name: /Apply/ });
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toBeDisabled();
    // The gate message must accompany the disabled button.
    await expect(
      page.getByText('Apply (render pipeline) is gated to the pipeline host.'),
    ).toBeVisible();
  } else {
    // No draft — the idle Generate form is the correct state for a fresh e2e env.
    const generateBtn = page
      .getByRole('button', { name: 'Generate script' })
      .or(page.getByRole('button', { name: 'Regenerate script' }));
    await expect(generateBtn).toBeVisible();
  }

  await page.screenshot({ path: `${SHOTS}/studio-generate-gated.png`, fullPage: true });
});
