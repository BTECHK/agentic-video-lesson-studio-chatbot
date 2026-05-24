import { describe, it, expect } from 'vitest';
import {
  lessonToTimeline,
  paginateCaptions,
  clipLeft,
  clipWidth,
  tickIntervalSec,
  formatTime,
  MIN_CLIP_PX,
  FPS,
  type LessonDoc,
} from '@/lib/studio-timeline';

const lesson: LessonDoc = {
  id: 'module-1',
  lesson: { title: 'Settings Walkthrough', duration: 90 }, // 3s @ 30fps
  scenes: [
    {
      id: 'intro',
      type: 'cover',
      start: 0,
      duration: 30, // 1s
      narration: {
        text: 'Here is the deal.',
        words: [
          { word: 'Here', startMs: 0, endMs: 200 },
          { word: 'is', startMs: 200, endMs: 350 },
          { word: 'the', startMs: 350, endMs: 500 },
          { word: 'deal.', startMs: 500, endMs: 900 },
        ],
      },
    },
    {
      id: 'recap',
      type: 'recap-grid',
      start: 30,
      duration: 60, // 2s
      // narration nested under content (the alternate location used by the planner)
      content: { narration: { text: 'Let us recap.', words: [{ word: 'Let', startMs: 1000, endMs: 1200 }] } },
    },
    {
      id: 'silent',
      type: 'quote-card',
      start: 90,
      duration: 30,
      // no narration → contributes an animation clip only
    },
  ],
};

describe('lessonToTimeline', () => {
  it('converts the lesson into four tracks keyed by kind', () => {
    const t = lessonToTimeline(lesson);
    expect(Object.keys(t.tracks).sort()).toEqual(['animation', 'captions', 'script', 'voiceover']);
    expect(t.title).toBe('Settings Walkthrough');
    expect(t.durationSec).toBeCloseTo(3, 5);
  });

  it('emits one animation clip per scene (narrated or not), with frame→second timing', () => {
    const { animation } = lessonToTimeline(lesson).tracks;
    expect(animation.map((c) => c.id)).toEqual(['anim-intro', 'anim-recap', 'anim-silent']);
    expect(animation[0].startSec).toBeCloseTo(0, 5);
    expect(animation[0].durationSec).toBeCloseTo(1, 5); // 30 frames / 30 fps
    expect(animation[1].startSec).toBeCloseTo(1, 5); // start 30 frames
  });

  it('emits voiceover and script clips only for narrated scenes', () => {
    const { voiceover, script } = lessonToTimeline(lesson).tracks;
    expect(voiceover.map((c) => c.id)).toEqual(['voice-intro', 'voice-recap']);
    expect(script.map((c) => c.id)).toEqual(['script-intro', 'script-recap']);
    expect(script[0].payload).toEqual({ text: 'Here is the deal.' });
  });

  it('reads narration nested under scene.content.narration too', () => {
    const { script } = lessonToTimeline(lesson).tracks;
    expect(script[1].payload).toEqual({ text: 'Let us recap.' });
  });

  it('defaults every clip to fresh and applies a supplied status map', () => {
    const fresh = lessonToTimeline(lesson);
    expect(fresh.tracks.voiceover.every((c) => c.status === 'fresh')).toBe(true);

    const t = lessonToTimeline(lesson, { 'voice-intro': { status: 'stale', reason: 'audio not generated' } });
    expect(t.tracks.voiceover[0].status).toBe('stale');
    expect(t.tracks.voiceover[0].staleReason).toBe('audio not generated');
    expect(t.tracks.voiceover[1].status).toBe('fresh');
  });
});

describe('paginateCaptions', () => {
  it('groups words into pages capped at maxWords', () => {
    const words = Array.from({ length: 10 }, (_, i) => ({ word: `w${i}`, startMs: i * 100, endMs: i * 100 + 90 }));
    const pages = paginateCaptions(words, { maxWords: 4 });
    expect(pages.length).toBe(3); // 4 + 4 + 2
    expect(pages[0].text).toBe('w0 w1 w2 w3');
    expect(pages[0].startSec).toBeCloseTo(0, 5);
    expect(pages[0].endSec).toBeCloseTo((300 + 90) / 1000, 5);
  });

  it('starts a new page when a word ends a sentence', () => {
    const words = [
      { word: 'Hello', startMs: 0, endMs: 200 },
      { word: 'there.', startMs: 200, endMs: 500 },
      { word: 'Next', startMs: 500, endMs: 700 },
    ];
    const pages = paginateCaptions(words, { maxWords: 8 });
    expect(pages.map((p) => p.text)).toEqual(['Hello there.', 'Next']);
  });

  it('returns no pages for empty input', () => {
    expect(paginateCaptions([], { maxWords: 4 })).toEqual([]);
  });
});

describe('caption track integration', () => {
  it('builds caption page clips per narrated scene from word timings', () => {
    const { captions } = lessonToTimeline(lesson).tracks;
    // intro has 4 words ending in a sentence → 1 page; recap has 1 word → 1 page
    expect(captions.length).toBe(2);
    expect(captions[0].id).toBe('cap-intro-0');
    expect(captions[0].payload).toEqual({ text: 'Here is the deal.' });
    expect(captions[0].startSec).toBeCloseTo(0, 5);
    expect(captions[0].durationSec).toBeCloseTo(0.9, 5);
  });

  it('labels clips by their unique scene id so same-section scenes stay distinct', () => {
    // Three intro beats share the section label "intro"; the timeline must
    // still show them as distinct clips (three beats).
    const doc: LessonDoc = {
      id: 'x',
      lesson: { title: 't', duration: 270 },
      scenes: [
        { id: 'intro-a', type: 'cover', start: 0, duration: 90, label: 'intro' },
        { id: 'intro-b', type: 'cover', start: 90, duration: 90, label: 'intro' },
        { id: 'intro-c', type: 'cover', start: 180, duration: 90, label: 'intro' },
      ],
    };
    const labels = lessonToTimeline(doc).tracks.animation.map((c) => c.label);
    expect(labels).toEqual(['intro-a', 'intro-b', 'intro-c']);
  });

  it('offsets caption clips by the scene start so they align with the lesson timeline', () => {
    // Word timings are scene-RELATIVE (each scene's audio starts at 0ms), so a
    // late scene's captions must be shifted to its absolute position, not 0.
    const doc: LessonDoc = {
      id: 'x',
      lesson: { title: 't', duration: 600 },
      scenes: [
        { id: 'a', type: 'cover', start: 0, duration: 300, narration: { text: 'First.', words: [{ word: 'First.', startMs: 0, endMs: 500 }] } },
        { id: 'b', type: 'recap-grid', start: 300, duration: 300, narration: { text: 'Second.', words: [{ word: 'Second.', startMs: 0, endMs: 500 }] } },
      ],
    };
    const { captions } = lessonToTimeline(doc).tracks;
    const capB = captions.find((c) => c.id === 'cap-b-0')!;
    expect(capB.startSec).toBeCloseTo(10, 5); // scene b starts at 300 frames = 10s
    expect(capB.durationSec).toBeCloseTo(0.5, 5);
  });
});

describe('clip geometry', () => {
  it('positions a clip at startSec * pxPerSec', () => {
    expect(clipLeft(5, 10)).toBe(50);
  });

  it('sizes a clip at durationSec * pxPerSec but never below MIN_CLIP_PX', () => {
    expect(clipWidth(5, 10)).toBe(50);
    expect(clipWidth(0.1, 10)).toBe(MIN_CLIP_PX);
  });
});

describe('tickIntervalSec', () => {
  it('shrinks the tick interval as zoom increases', () => {
    expect(tickIntervalSec(80)).toBe(1);
    expect(tickIntervalSec(20)).toBe(5);
    expect(tickIntervalSec(5)).toBe(10);
  });
});

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(75)).toBe('1:15');
  });
});

describe('FPS', () => {
  it('is 30 (matches the render pipeline)', () => {
    expect(FPS).toBe(30);
  });
});
