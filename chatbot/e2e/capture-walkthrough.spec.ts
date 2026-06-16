import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Stakeholder SizzleReel capture (#74, Layer A).
 *
 * Drives the live console end-to-end and records each beat as its own 1920x1080
 * clip, so the Remotion `SizzleReel` composition can composite REAL footage
 * (`<OffthreadVideo>`) in place of the simulated scene shells. Hands-off + re-runnable.
 *
 * Run on a host with browsers installed (uses the config's fresh server on :3201,
 * LLM_PROVIDER=mock — no live/paid calls):
 *   cd chatbot && npx playwright install chromium
 *   npm run test:e2e -- capture-walkthrough
 *
 * Clips land in out/capture/<beat>.webm at the repo root (git-ignored, like other
 * media). Point SizzleReel's capture props at public/capture/<beat>.webm after
 * copying them in (staticFile resolves from public/).
 */
const CAPTURE_DIR = path.join(process.cwd(), '..', 'out', 'capture');
const SIZE = { width: 1920, height: 1080 };

/** A tour beat: a name + the interaction to record. Keep each ~4–6s of motion. */
const BEATS: { name: string; run: (page: Page) => Promise<void> }[] = [
  {
    name: 'chat',
    run: async (page) => {
      await page.goto('/chat');
      await page.getByRole('textbox').first().fill('Which AI tool is best for research?');
      await settle(page, 1500);
      const send = page.getByRole('button', { name: /send/i }).first();
      if (await send.isVisible().catch(() => false)) await send.click();
      await settle(page, 3000);
    },
  },
  {
    name: 'content',
    run: async (page) => {
      await page.goto('/content');
      await settle(page, 2500);
    },
  },
  {
    name: 'compare',
    run: async (page) => {
      await page.goto('/content/compare');
      await settle(page, 3000);
    },
  },
  {
    name: 'generate',
    run: async (page) => {
      await page.goto('/studio/generate');
      await settle(page, 3000);
    },
  },
];

async function settle(page: Page, ms = 1200): Promise<void> {
  await page.waitForTimeout(ms);
}

test('capture walkthrough beats for the SizzleReel', async ({ browser }) => {
  test.slow(); // recording several beats end-to-end
  mkdirSync(CAPTURE_DIR, { recursive: true });

  for (const beat of BEATS) {
    const context = await browser.newContext({
      viewport: SIZE,
      recordVideo: { dir: CAPTURE_DIR, size: SIZE },
    });
    const page = await context.newPage();
    try {
      await beat.run(page);
    } finally {
      await context.close(); // finalizes the recording
      const video = page.video();
      if (video) await video.saveAs(path.join(CAPTURE_DIR, `${beat.name}.webm`));
    }
  }
});
