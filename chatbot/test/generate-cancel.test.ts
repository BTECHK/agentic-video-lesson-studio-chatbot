import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { runGenerator, GenerationAbortedError } from '../src/app/api/generate/route';

/** Minimal fake child process: an EventEmitter with a stderr stream + kill spy. */
function fakeChild() {
  const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; kill: ReturnType<typeof vi.fn> };
  child.stderr = new EventEmitter();
  child.kill = vi.fn();
  return child;
}

describe('runGenerator cancellation (#34)', () => {
  it('rejects immediately if the signal is already aborted (no spawn)', async () => {
    const spawnFn = vi.fn();
    const controller = new AbortController();
    controller.abort();
    await expect(
      runGenerator('module-1', '/root', { signal: controller.signal, spawnFn: spawnFn as never }),
    ).rejects.toBeInstanceOf(GenerationAbortedError);
    expect(spawnFn).not.toHaveBeenCalled();
  });

  it('kills the child and rejects when the request is aborted mid-run', async () => {
    const child = fakeChild();
    const spawnFn = vi.fn(() => child);
    const controller = new AbortController();
    const p = runGenerator('module-1', '/root', { signal: controller.signal, spawnFn: spawnFn as never });

    controller.abort(); // client hit Cancel

    await expect(p).rejects.toBeInstanceOf(GenerationAbortedError);
    expect(child.kill).toHaveBeenCalledTimes(1);
  });

  it('resolves with the exit code on normal completion', async () => {
    const child = fakeChild();
    const spawnFn = vi.fn(() => child);
    const p = runGenerator('module-1', '/root', { spawnFn: spawnFn as never });
    child.stderr.emit('data', 'some log');
    child.emit('close', 0);
    await expect(p).resolves.toEqual({ code: 0, stderr: 'some log' });
  });
});
