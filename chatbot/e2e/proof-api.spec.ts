import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('capture key API responses for launch proof', async ({ request }, testInfo) => {
  const evidence: Record<string, unknown> = {};

  const access = await request.post('/api/access', { data: { code: 'wrong-code' } });
  evidence.access = { status: access.status(), body: await access.json() };

  const session = await request.post('/api/session', { data: { accessMode: 'demo' } });
  const sessionBody = await session.json();
  evidence.session = { status: session.status(), body: sessionBody };

  const chat = await request.post('/api/chat', {
    data: {
      sessionId: sessionBody.sessionId,
      message: 'What is ChatGPT?',
      mode: 'ta',
    },
  });
  evidence.chat = { status: chat.status(), body: await chat.json() };

  const ingestUnauthorized = await request.post('/api/ingest', { data: { mode: 'poll' } });
  evidence.ingestUnauthorized = {
    status: ingestUnauthorized.status(),
    body: await ingestUnauthorized.json(),
  };

  expect(session.ok()).toBe(true);
  expect(chat.ok()).toBe(true);
  expect(ingestUnauthorized.status()).toBe(401);

  const outPath = testInfo.outputPath('api-responses.json');
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf-8');
});
