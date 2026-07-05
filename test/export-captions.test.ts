import { describe, it, expect } from 'vitest';
import { buildLessonCues, cuesToSrt } from '../scripts/export-captions';
import type { Lesson } from '../content/schemas/lesson';

// FV2 / AC3 — cues must be offset by the scene's start (frames @ 30fps -> ms),
// monotonic/non-overlapping, and serialize to valid SRT timestamps. Scene 2
// starts at frame 900 (900 / 30 * 1000 = 30000ms), so its first cue must
// begin at +30000ms relative to its own scene-local word timestamps.
const LESSON: Lesson = {
  schemaVersion: '1.0',
  id: 'fixture-lesson',
  lesson: { title: 'Fixture', topic: 'test', module: 'test', duration: 1200 },
  scenes: [
    {
      id: 'scene-1',
      type: 'quote-card',
      start: 0,
      duration: 900,
      content: {},
      narration: {
        text: 'Hello there',
        words: [
          { word: 'Hello', startMs: 0, endMs: 400 },
          { word: 'there', startMs: 400, endMs: 800 },
        ],
      },
    },
    {
      id: 'scene-2',
      type: 'quote-card',
      start: 900,
      duration: 300,
      content: {},
      narration: {
        text: 'Goodbye now',
        words: [
          { word: 'Goodbye', startMs: 0, endMs: 400 },
          { word: 'now', startMs: 400, endMs: 800 },
        ],
      },
    },
  ],
  meta: { createdAt: '', lastUpdated: '', authors: [], factCheckedAt: null },
};

describe('buildLessonCues', () => {
  it('offsets scene 2 cues by scene.start converted from frames to ms (900f @ 30fps = +30000ms)', () => {
    const cues = buildLessonCues(LESSON, 1400);
    const scene2Cue = cues.find((c) => c.text.includes('Goodbye'));
    expect(scene2Cue).toBeDefined();
    // scene-2's word starts at 0ms scene-relative; offset is 900/30*1000 = 30000ms.
    expect(scene2Cue!.startMs).toBe(30000);
  });

  it('produces monotonic, non-overlapping cues', () => {
    const cues = buildLessonCues(LESSON, 1400);
    expect(cues.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < cues.length - 1; i++) {
      expect(cues[i].endMs).toBeLessThanOrEqual(cues[i + 1].startMs);
      expect(cues[i].startMs).toBeLessThan(cues[i].endMs);
    }
  });

  it('joins words into plain space-separated text per cue', () => {
    const cues = buildLessonCues(LESSON, 1400);
    expect(cues[0].text).toBe('Hello there');
  });
});

describe('cuesToSrt', () => {
  it('serializes valid SRT timestamps (HH:MM:SS,mmm --> HH:MM:SS,mmm)', () => {
    const cues = buildLessonCues(LESSON, 1400);
    const srt = cuesToSrt(cues);
    const timingLines = srt
      .split('\n')
      .filter((line) => line.includes('-->'));
    expect(timingLines.length).toBe(cues.length);
    const srtTimestamp = /^\d{2}:\d{2}:\d{2},\d{3}$/;
    for (const line of timingLines) {
      const [start, , end] = line.split(' ');
      expect(start).toMatch(srtTimestamp);
      expect(end).toMatch(srtTimestamp);
    }
    // scene-2's cue offset (30000ms) formats as 00:00:30,000
    expect(srt).toContain('00:00:30,000 -->');
  });

  it('numbers cues sequentially starting at 1', () => {
    const cues = buildLessonCues(LESSON, 1400);
    const srt = cuesToSrt(cues);
    const indexLines = srt
      .split('\n\n')
      .filter((block) => block.trim().length > 0)
      .map((block) => block.split('\n')[0]);
    expect(indexLines).toEqual(cues.map((_, i) => String(i + 1)));
  });
});
