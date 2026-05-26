import { test, expect } from '@playwright/test';

/**
 * Pattern smoke test (H0 item 6).
 *
 * Proves the Playwright harness drives a real browser against the running app.
 * It asserts a currently-true fact (the home page renders its hero heading) —
 * NOT the un-wired RAG chain, whose verification is deferred per
 * .planning/PROJECT-PLAN-2026-05-23.md §7 ("Chatbot re-verify: Not now").
 *
 * When CHAT-01/02 are wired, add a real anti-phantom test here: type a
 * question, submit, and assert the response actually reflects retrieved
 * content (the chain fires) rather than a generic reply.
 */
test('home page renders the internal-console hero heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'The control room',
  );
});

test('marketing surface still renders its hero heading', async ({ page }) => {
  await page.goto('/marketing');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Learn to work with',
  );
});
