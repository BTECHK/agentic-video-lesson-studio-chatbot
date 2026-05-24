import { describe, it, expect, vi } from 'vitest';
import {
  createLogger,
  serializeError,
  formatConsoleLine,
  consoleSink,
  runMain,
  type LogRecord,
  type LoggerSink,
} from '../src/lib/logger';

function captureSink(): { records: LogRecord[]; printed: Array<[string, string]>; sink: LoggerSink } {
  const records: LogRecord[] = [];
  const printed: Array<[string, string]> = [];
  return {
    records,
    printed,
    sink: {
      record: (r) => records.push(r),
      print: (level, line) => printed.push([level, line]),
    },
  };
}

const fixedNow = () => new Date('2026-05-24T12:00:00.000Z');

describe('createLogger', () => {
  it('builds a structured record with channel, level, msg and timestamp', () => {
    const cap = captureSink();
    const log = createLogger({ channel: 'tts', sink: cap.sink, now: fixedNow });

    log.info('synthesizing scene');

    expect(cap.records).toHaveLength(1);
    expect(cap.records[0]).toMatchObject({
      level: 'info',
      channel: 'tts',
      msg: 'synthesizing scene',
      ts: '2026-05-24T12:00:00.000Z',
    });
  });

  it('merges extra fields into the record', () => {
    const cap = captureSink();
    const log = createLogger({ channel: 'align', sink: cap.sink, now: fixedNow });

    log.info('measured scene', { sceneId: 'cover', seconds: 4.2 });

    expect(cap.records[0]).toMatchObject({ sceneId: 'cover', seconds: 4.2 });
  });

  it('suppresses debug records when minLevel is info (the default)', () => {
    const cap = captureSink();
    const log = createLogger({ channel: 'tts', sink: cap.sink, now: fixedNow });

    log.debug('verbose detail');
    log.info('kept');

    expect(cap.records).toHaveLength(1);
    expect(cap.records[0].msg).toBe('kept');
  });

  it('emits debug records when minLevel is debug', () => {
    const cap = captureSink();
    const log = createLogger({ channel: 'tts', sink: cap.sink, now: fixedNow, minLevel: 'debug' });

    log.debug('verbose detail');

    expect(cap.records).toHaveLength(1);
    expect(cap.records[0].level).toBe('debug');
  });

  it('serializes an Error passed in the err field', () => {
    const cap = captureSink();
    const log = createLogger({ channel: 'render', sink: cap.sink, now: fixedNow });

    log.error('render failed', { err: new Error('boom') });

    expect(cap.records[0].err).toMatchObject({ name: 'Error', message: 'boom' });
    expect(typeof (cap.records[0].err as { stack: string }).stack).toBe('string');
  });
});

describe('serializeError', () => {
  it('extracts name, message and stack from an Error', () => {
    const e = new TypeError('bad input');
    const s = serializeError(e);
    expect(s).toMatchObject({ name: 'TypeError', message: 'bad input' });
    expect(s.stack).toContain('TypeError');
  });

  it('stringifies non-Error throwables', () => {
    expect(serializeError('plain string')).toEqual({ name: 'NonError', message: 'plain string' });
  });
});

describe('formatConsoleLine', () => {
  it('includes the level tag, channel and message', () => {
    const rec: LogRecord = { ts: 'x', level: 'warn', channel: 'tts', msg: 'slow scene' };
    const line = formatConsoleLine(rec);
    expect(line).toContain('tts');
    expect(line).toContain('slow scene');
    expect(line.toLowerCase()).toContain('warn');
  });
});

describe('consoleSink', () => {
  it('routes info to stdout and error to stderr', () => {
    const out: string[] = [];
    const err: string[] = [];
    const sink = consoleSink({
      stdout: (s) => out.push(s),
      stderr: (s) => err.push(s),
    });

    sink.print('info', 'hello');
    sink.print('error', 'broke');
    sink.print('warn', 'careful');

    expect(out).toEqual(['hello']);
    expect(err).toEqual(['broke', 'careful']);
  });
});

describe('runMain', () => {
  it('returns the exit code from the main fn', async () => {
    const cap = captureSink();
    const exit = vi.fn();
    const log = createLogger({ channel: 'test', sink: cap.sink, now: fixedNow });

    await runMain('test', () => 0, { logger: log, exit });

    expect(exit).toHaveBeenCalledWith(0);
  });

  it('catches a thrown error, logs it structurally and exits 1', async () => {
    const cap = captureSink();
    const exit = vi.fn();
    const log = createLogger({ channel: 'test', sink: cap.sink, now: fixedNow });

    await runMain('test', () => {
      throw new Error('unhandled');
    }, { logger: log, exit });

    expect(exit).toHaveBeenCalledWith(1);
    const errRec = cap.records.find((r) => r.level === 'error');
    expect(errRec).toBeDefined();
    expect((errRec!.err as { message: string }).message).toBe('unhandled');
  });

  it('awaits an async main and propagates its code', async () => {
    const cap = captureSink();
    const exit = vi.fn();
    const log = createLogger({ channel: 'test', sink: cap.sink, now: fixedNow });

    await runMain('test', async () => {
      await Promise.resolve();
      return 2;
    }, { logger: log, exit });

    expect(exit).toHaveBeenCalledWith(2);
  });
});
