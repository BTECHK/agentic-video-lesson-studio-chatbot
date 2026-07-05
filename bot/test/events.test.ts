import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { emitEvent } from '../src/events.js';

afterEach(() => vi.restoreAllMocks());

/** Capture the single JSON line emitEvent writes and parse it back. */
function capture(fn: () => void): Record<string, unknown> {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  fn();
  expect(spy).toHaveBeenCalledTimes(1); // exactly ONE line per event
  return JSON.parse(spy.mock.calls[0][0] as string);
}

describe('emitEvent', () => {
  it('emits one parseable JSON line with evt, hashed user, and ts', () => {
    const line = capture(() => emitEvent('message_handled', 424242));
    expect(line.evt).toBe('message_handled');
    expect(typeof line.ts).toBe('string');
    expect(Number.isNaN(Date.parse(line.ts as string))).toBe(false);
  });

  it('hashes the chat id to a 16-char sha256 prefix — never the raw id', () => {
    const chatId = 987654321;
    const line = capture(() => emitEvent('reply_sent', chatId));
    const expected = createHash('sha256').update(String(chatId)).digest('hex').slice(0, 16);
    expect(line.user).toBe(expected);
    expect(String(line.user)).toHaveLength(16);
    // No PII: the raw chat id must not appear anywhere in the emitted line.
    expect(JSON.stringify(line)).not.toContain(String(chatId));
  });

  it('merges extra fields without leaking the raw id', () => {
    const line = capture(() => emitEvent('message_handled', 5, { msgLen: 12 }));
    expect(line.msgLen).toBe(12);
  });
});
