import { test, expect, type Page } from '@playwright/test';

/**
 * #64: Tutor RAG invariants, proven through the real UI against a fresh server with
 * the deterministic mock provider (LLM_PROVIDER=mock, set by playwright.config.ts).
 *
 * The mock provider mirrors the real contract: it emits a grounded, tool-cited
 * answer when content is retrieved, and a generic answer (citing a non-retrieved
 * tool) when nothing matches. The route's keepGroundedCitations guard then strips
 * any citation whose tool was not retrieved — which is what these tests pin down.
 */

async function enterDemoChat(page: Page) {
  await page.goto('/chat');
  await page.getByRole('button', { name: 'Try Demo' }).click();
  // The composer enables only after POST /api/session resolves.
  await expect(page.getByPlaceholder('Ask Tutor a question...')).toBeEnabled();
}

async function ask(page: Page, question: string) {
  await page.getByPlaceholder('Ask Tutor a question...').fill(question);
  await page.getByRole('button', { name: 'Send' }).click();
}

test('a known course question returns a grounded answer with a verified citation', async ({ page }) => {
  await enterDemoChat(page);
  await ask(page, 'What is ChatGPT?');

  // The answer reflects retrieved content (the RAG chain actually fired) ...
  await expect(
    page.getByText(/grounded in the Sample Academy content repository/i),
  ).toBeVisible();
  // ... and a citation badge that maps to a real source is shown.
  await expect(page.getByRole('button', { name: /Module 1, Lesson 1/ })).toBeVisible();
});

test('an off-topic question answers without fabricating a citation (hallucination guard)', async ({ page }) => {
  await enterDemoChat(page);
  await ask(page, 'qzx flibberwocket nonexistent topic 9482');

  // Tutor answers (per the decision: never hard-refuse) ...
  await expect(page.getByText(/mock response/i)).toBeVisible();
  // ... but the un-retrieved (fabricated) source is filtered out — no source badge.
  await expect(page.getByRole('button', { name: /Module/ })).toHaveCount(0);
});
