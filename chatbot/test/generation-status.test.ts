import { describe, it, expect } from 'vitest';
import {
  resolveGenerationStatus,
  isTerminalStatus,
} from '../src/lib/generation-status';

describe('resolveGenerationStatus (#44)', () => {
  it('no status file → idle', () => {
    expect(
      resolveGenerationStatus({ hasStatusFile: false, pidAlive: false, draftExists: false }),
    ).toBe('idle');
  });

  it('recorded running + pid alive → running', () => {
    expect(
      resolveGenerationStatus({
        hasStatusFile: true,
        recorded: 'running',
        pidAlive: true,
        draftExists: false,
        startedAtMs: 1000,
      }),
    ).toBe('running');
  });

  it('recorded running + pid dead + fresh draft → done', () => {
    expect(
      resolveGenerationStatus({
        hasStatusFile: true,
        recorded: 'running',
        pidAlive: false,
        draftExists: true,
        draftMtimeMs: 2000,
        startedAtMs: 1000,
      }),
    ).toBe('done');
  });

  it('recorded running + pid dead + draft older than startedAt → error (stale draft)', () => {
    expect(
      resolveGenerationStatus({
        hasStatusFile: true,
        recorded: 'running',
        pidAlive: false,
        draftExists: true,
        draftMtimeMs: 500,
        startedAtMs: 1000,
      }),
    ).toBe('error');
  });

  it('recorded running + pid dead + no draft → error', () => {
    expect(
      resolveGenerationStatus({
        hasStatusFile: true,
        recorded: 'running',
        pidAlive: false,
        draftExists: false,
        startedAtMs: 1000,
      }),
    ).toBe('error');
  });

  it('persisted done → done (terminal, ignores fs facts)', () => {
    expect(
      resolveGenerationStatus({
        hasStatusFile: true,
        recorded: 'done',
        pidAlive: false,
        draftExists: false,
      }),
    ).toBe('done');
  });

  it('persisted error → error (terminal)', () => {
    expect(
      resolveGenerationStatus({
        hasStatusFile: true,
        recorded: 'error',
        pidAlive: true,
        draftExists: true,
        draftMtimeMs: 5000,
        startedAtMs: 1000,
      }),
    ).toBe('error');
  });

  it('persisted canceled → canceled (terminal)', () => {
    expect(
      resolveGenerationStatus({
        hasStatusFile: true,
        recorded: 'canceled',
        pidAlive: false,
        draftExists: false,
      }),
    ).toBe('canceled');
  });
});

describe('isTerminalStatus — write guard (#70 P1.10)', () => {
  it('done/error/canceled are terminal (immovable)', () => {
    expect(isTerminalStatus('done')).toBe(true);
    expect(isTerminalStatus('error')).toBe(true);
    expect(isTerminalStatus('canceled')).toBe(true);
  });

  it('running is not terminal (still settleable/cancelable)', () => {
    expect(isTerminalStatus('running')).toBe(false);
  });
});
