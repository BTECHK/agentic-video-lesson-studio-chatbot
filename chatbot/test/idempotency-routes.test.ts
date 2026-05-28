import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function jsonPost(url: string, body: unknown, idempotencyKey: string): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(body),
  });
}

describe('idempotency keys on operator routes (#61)', () => {
  let root: string | null = null;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_DEV_BYPASS', 'true');
    const { resetIdempotencyCache } = await import('@/lib/idempotency');
    resetIdempotencyCache();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    if (root) {
      rmSync(root, { recursive: true, force: true });
      root = null;
    }
    const { resetIdempotencyCache } = await import('@/lib/idempotency');
    resetIdempotencyCache();
  });

  it('replays /api/generate and avoids duplicate spawn', async () => {
    root = mkdtempSync(path.join(tmpdir(), 'idem-generate-'));
    const lessonDir = path.join(root, 'content', 'lessons', 'module-1');
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(path.join(lessonDir, 'outline.json'), '{}');
    const appDir = path.join(root, 'app');
    mkdirSync(appDir, { recursive: true });
    vi.spyOn(process, 'cwd').mockImplementation(() => appDir);

    const spawnMock = vi.fn(() => ({ pid: 4242, unref: vi.fn() }));
    vi.doMock('node:child_process', () => ({ spawn: spawnMock }));

    const { POST } = await import('@/app/api/generate/route');

    const first = await POST(
      jsonPost('http://localhost/api/generate', { lessonId: 'module-1' }, 'same-key'),
    );
    expect(first.status).toBe(200);
    expect(spawnMock).toHaveBeenCalledTimes(1);

    const second = await POST(
      jsonPost('http://localhost/api/generate', { lessonId: 'module-1' }, 'same-key'),
    );
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(second.status).toBe(200);
    expect((await second.json()).idempotentReplay).toBe(true);
  });

  it('replays /api/ingest and avoids duplicate spawn', async () => {
    vi.stubEnv('INGEST_TRIGGER_ENABLED', 'true');
    const spawnMock = vi.fn(() => ({ pid: 5150, unref: vi.fn() }));
    vi.doMock('node:child_process', () => ({ spawn: spawnMock }));
    const { POST } = await import('@/app/api/ingest/route');

    const first = await POST(jsonPost('http://localhost/api/ingest', { mode: 'poll' }, 'ingest-key'));
    expect(first.status).toBe(200);
    expect(spawnMock).toHaveBeenCalledTimes(1);

    const second = await POST(jsonPost('http://localhost/api/ingest', { mode: 'poll' }, 'ingest-key'));
    expect(second.status).toBe(200);
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect((await second.json()).idempotentReplay).toBe(true);
  });

  it('replays /api/regen and avoids duplicate spawn', async () => {
    vi.stubEnv('REGEN_TRIGGER_ENABLED', 'true');
    const spawnMock = vi.fn(() => ({ pid: 6160, unref: vi.fn() }));
    vi.doMock('node:child_process', () => ({ spawn: spawnMock }));
    const { POST } = await import('@/app/api/regen/route');

    const first = await POST(
      jsonPost('http://localhost/api/regen', { lessonId: 'module-1' }, 'regen-key'),
    );
    expect(first.status).toBe(200);
    expect(spawnMock).toHaveBeenCalledTimes(1);

    const second = await POST(
      jsonPost('http://localhost/api/regen', { lessonId: 'module-1' }, 'regen-key'),
    );
    expect(second.status).toBe(200);
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect((await second.json()).idempotentReplay).toBe(true);
  });
});
