import { describe, it, expect } from 'vitest';
import { LessonSchema } from '../content/schemas/lesson';
import { OutlineSchema } from '../content/schemas/outline';

// --- Helpers ---

function makeValidLesson(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0',
    id: 'test-lesson',
    lesson: { title: 'Test', topic: 'T1', module: 'M1', duration: 15 },
    scenes: [
      { id: 's1', type: 'cover', start: 0, duration: 8, content: { eyebrow: 'E', title: ['T'], sub: 'S' } },
      { id: 's2', type: 'recap-grid', start: 8, duration: 7, content: { eyebrow: 'E', title: 'T', cards: [] } },
    ],
    meta: { createdAt: '2026-01-01', lastUpdated: '2026-01-01', authors: ['Test'], factCheckedAt: null },
    ...overrides,
  };
}

function makeValidOutline(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0',
    id: 'module-1',
    lesson: { title: 'Welcome to AI', topic: 'Foundations', module: 'Module 1' },
    audience: 'Beginners new to AI',
    sections: [
      {
        id: 'intro',
        title: 'Why AI now',
        objective: 'Learner understands why this moment matters',
        beats: [
          { id: 'b1', summary: 'Open with the shift happening in AI', sceneTypeHint: 'cover' },
          {
            id: 'b2',
            summary: 'Introduce the three tools',
            sceneTypeHint: 'tool-card-reveal',
            toolRefs: ['claude', 'gemini'],
            capabilityRefs: ['writing-chat'],
          },
        ],
      },
    ],
    meta: { createdAt: '2026-05-23', lastUpdated: '2026-05-23', authors: ['Instructor'] },
    ...overrides,
  };
}

// --- narration layer on scenes (VOICE-04) ---

describe('SceneBaseSchema narration layer', () => {
  it('accepts a lesson scene with no narration (backward compatible)', () => {
    expect(LessonSchema.safeParse(makeValidLesson()).success).toBe(true);
  });

  it('accepts a scene with narration text only', () => {
    const lesson = makeValidLesson({
      scenes: [
        {
          id: 's1', type: 'cover', start: 0, duration: 15,
          content: { eyebrow: 'E', title: ['T'], sub: 'S' },
          narration: { text: 'Welcome to the first lesson.' },
        },
      ],
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 15 },
    });
    expect(LessonSchema.safeParse(lesson).success).toBe(true);
  });

  it('accepts a scene with full narration incl. word timings', () => {
    const lesson = makeValidLesson({
      scenes: [
        {
          id: 's1', type: 'cover', start: 0, duration: 15,
          content: { eyebrow: 'E', title: ['T'], sub: 'S' },
          narration: {
            text: 'Welcome here',
            audioSrc: 'audio/module-1/scene-01.wav',
            words: [
              { word: 'Welcome', startMs: 0, endMs: 480 },
              { word: 'here', startMs: 480, endMs: 900 },
            ],
          },
        },
      ],
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 15 },
    });
    expect(LessonSchema.safeParse(lesson).success).toBe(true);
  });

  it('rejects narration with non-string text', () => {
    const lesson = makeValidLesson({
      scenes: [
        {
          id: 's1', type: 'cover', start: 0, duration: 15,
          content: { eyebrow: 'E', title: ['T'], sub: 'S' },
          narration: { text: 42 },
        },
      ],
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 15 },
    });
    expect(LessonSchema.safeParse(lesson).success).toBe(false);
  });

  it('rejects a word timing missing endMs', () => {
    const lesson = makeValidLesson({
      scenes: [
        {
          id: 's1', type: 'cover', start: 0, duration: 15,
          content: { eyebrow: 'E', title: ['T'], sub: 'S' },
          narration: { text: 'Hi', words: [{ word: 'Hi', startMs: 0 }] },
        },
      ],
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 15 },
    });
    expect(LessonSchema.safeParse(lesson).success).toBe(false);
  });
});

// --- OutlineSchema (OUTLINE-01) ---

describe('OutlineSchema', () => {
  it('accepts a valid outline', () => {
    expect(OutlineSchema.safeParse(makeValidOutline()).success).toBe(true);
  });

  it('accepts a beat without optional refs', () => {
    const outline = makeValidOutline({
      sections: [
        {
          id: 's', title: 'T', objective: 'O',
          beats: [{ id: 'b1', summary: 'Just narrate' }],
        },
      ],
    });
    expect(OutlineSchema.safeParse(outline).success).toBe(true);
  });

  it('rejects an outline with zero sections', () => {
    expect(OutlineSchema.safeParse(makeValidOutline({ sections: [] })).success).toBe(false);
  });

  it('rejects a section with zero beats', () => {
    const outline = makeValidOutline({
      sections: [{ id: 's', title: 'T', objective: 'O', beats: [] }],
    });
    expect(OutlineSchema.safeParse(outline).success).toBe(false);
  });

  it('rejects an invalid sceneTypeHint', () => {
    const outline = makeValidOutline({
      sections: [
        {
          id: 's', title: 'T', objective: 'O',
          beats: [{ id: 'b1', summary: 'x', sceneTypeHint: 'not-a-scene' }],
        },
      ],
    });
    expect(OutlineSchema.safeParse(outline).success).toBe(false);
  });

  it('rejects wrong schemaVersion', () => {
    expect(OutlineSchema.safeParse(makeValidOutline({ schemaVersion: '2.0' })).success).toBe(false);
  });
});
