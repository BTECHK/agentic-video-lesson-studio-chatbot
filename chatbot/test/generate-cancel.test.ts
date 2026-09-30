import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * #44 — generation is decoupled from the request: POST spawns a detached,
 * unref'd background child, records a status file, and returns immediately.
 * It must NOT tie the child to req.signal, and must not double-spawn a job
 * that is already running. (Cancellation now lives in POST /api/generate/cancel,
 * driven by the recorded pid — not by aborting the fetch.)
 */

// A scratch repo root: <tmp>/content/lessons/module-1/outline.json
let root: string;
const cwdSpy = vi.fn();

function makeReq(body: unknown) {
  return { json: async () => body } as never;
}

beforeEach(() => {
  // Authorize as the local operator (#60): these tests exercise #44 spawn/cancel
  // behavior, not the auth boundary. The dev bypass short-circuits before headers.
  vi.stubEnv('NEXT_PUBLIC_DEV_BYPASS', 'true');
  root = mkdtempSync(path.join(tmpdir(), 'gen-decouple-'));
  const lessonDir = path.join(root, 'content', 'lessons', 'module-1');
  mkdirSync(lessonDir, { recursive: true });
  writeFileSync(path.join(lessonDir, 'outline.json'), '{}');
  // route does path.join(process.cwd(), '..'); point cwd at <root>/app so '..' == root.
  const appDir = path.join(root, 'app');
  mkdirSync(appDir, { recursive: true });
  vi.spyOn(process, 'cwd').mockImplementation(() => appDir);
  cwdSpy.mockClear();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

describe('POST /api/generate — detached background spawn (#44)', () => {
  it('spawns detached + unref, writes a running status file, returns running — never tied to req.signal', async () => {
    const unref = vi.fn();
    const spawnArgs: unknown[] = [];
    vi.doMock('node:child_process', () => ({
      spawn: (...args: unknown[]) => {
        spawnArgs.push(args);
        return { pid: 4242, unref };
      },
    }));
    const { POST } = await import('../src/app/api/generate/route');
    const { statusFilePath } = await import('../src/lib/generation-status');

    const res = await POST(makeReq({ lessonId: 'module-1' }));
    expect(await res.json()).toEqual({ status: 'running' });
    expect(unref).toHaveBeenCalledTimes(1);

    // detached + ignored stdio, no signal anywhere
    const [, , opts] = spawnArgs[0] as [string, string[], Record<string, unknown>];
    expect(opts.detached).toBe(true);
    expect(opts.stdio).toBe('ignore');
    expect(opts.signal).toBeUndefined();

    const statusFile = statusFilePath(root, 'module-1');
    const status = JSON.parse(readFileSync(statusFile, 'utf-8'));
    expect(status.status).toBe('running');
    expect(status.pid).toBe(4242);
    expect(typeof status.startedAt).toBe('string');
  });

  it('does not double-spawn when a live job is already running', async () => {
    let spawnCount = 0;
    vi.doMock('node:child_process', () => ({
      spawn: () => {
        spawnCount += 1;
        return { pid: process.pid, unref: vi.fn() }; // our own pid → guaranteed alive
      },
    }));
    const { POST } = await import('../src/app/api/generate/route');
    const { statusFilePath } = await import('../src/lib/generation-status');

    // Pre-seed a running status file with a live pid (this test process).
    const statusFile = statusFilePath(root, 'module-1');
    writeFileSync(
      statusFile,
      JSON.stringify({ status: 'running', pid: process.pid, startedAt: new Date().toISOString() }),
    );

    const res = await POST(makeReq({ lessonId: 'module-1' }));
    expect(await res.json()).toEqual({ status: 'running' });
    expect(spawnCount).toBe(0); // reported existing job, did not spawn
  });

  it('rejects an invalid lessonId without spawning', async () => {
    let spawnCount = 0;
    vi.doMock('node:child_process', () => ({
      spawn: () => {
        spawnCount += 1;
        return { pid: 1, unref: vi.fn() };
      },
    }));
    const { POST } = await import('../src/app/api/generate/route');
    const res = await POST(makeReq({ lessonId: 'Bad Id!' }));
    expect(res.status).toBe(400);
    expect(spawnCount).toBe(0);
  });

  it('404s when the lesson has no outline', async () => {
    vi.doMock('node:child_process', () => ({ spawn: () => ({ pid: 1, unref: vi.fn() }) }));
    const { POST } = await import('../src/app/api/generate/route');
    const res = await POST(makeReq({ lessonId: 'no-such-lesson' }));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/generate/cancel (#44)', () => {
  it('kills the recorded pid tree and marks the job canceled (#67)', async () => {
    // Mock the process-tree seam so we assert the route tree-kills the recorded pid
    // and waits for exit — without spawning a real taskkill / touching live pids.
    const killCalls: number[] = [];
    vi.doMock('@/lib/process-tree', () => ({
      killProcessTree: (pid: number) => {
        killCalls.push(pid);
      },
      waitForExit: async () => true,
    }));
    const { statusFilePath } = await import('../src/lib/generation-status');
    const { POST: cancel } = await import('../src/app/api/generate/cancel/route');

    const statusFile = statusFilePath(root, 'module-1');
    writeFileSync(statusFile, JSON.stringify({ status: 'running', pid: 9999, startedAt: new Date().toISOString() }));

    const res = await cancel(makeReq({ lessonId: 'module-1' }));
    expect(await res.json()).toEqual({ status: 'canceled' });
    expect(killCalls).toContain(9999); // whole tree killed by recorded pid
    expect(JSON.parse(readFileSync(statusFile, 'utf-8')).status).toBe('canceled');
  });

  it('no-ops cleanly when there is no status file', async () => {
    const { POST: cancel } = await import('../src/app/api/generate/cancel/route');
    const res = await cancel(makeReq({ lessonId: 'module-1' }));
    expect(await res.json()).toEqual({ status: 'canceled' });
    expect(existsSync(path.join(root, 'content', 'lessons', 'module-1', '.generate-status.json'))).toBe(false);
  });
});
