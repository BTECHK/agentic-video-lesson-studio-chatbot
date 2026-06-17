import { describe, it, expect } from 'vitest';
import { formatLogLine } from '../src/lib/log';

describe('formatLogLine (#70 P1.13)', () => {
  const now = new Date('2026-06-17T12:00:00.000Z');

  it('emits a single-line JSON object with iso timestamp, level, event and fields', () => {
    const line = formatLogLine('generate.spawned', { lessonId: 'topic-1-lesson-1', pid: 1234 }, now);
    expect(line).not.toContain('\n');
    expect(JSON.parse(line)).toMatchObject({
      t: '2026-06-17T12:00:00.000Z',
      level: 'info',
      event: 'generate.spawned',
      lessonId: 'topic-1-lesson-1',
      pid: 1234,
    });
  });

  it('works with no fields', () => {
    const parsed = JSON.parse(formatLogLine('chat.completed', {}, now));
    expect(parsed.event).toBe('chat.completed');
    expect(parsed.t).toBe('2026-06-17T12:00:00.000Z');
  });

  it('canonical keys win over caller fields (event cannot be spoofed)', () => {
    const parsed = JSON.parse(formatLogLine('real.event', { event: 'spoofed', t: 'fake' }, now));
    expect(parsed.event).toBe('real.event');
    expect(parsed.t).toBe('2026-06-17T12:00:00.000Z');
  });
});
