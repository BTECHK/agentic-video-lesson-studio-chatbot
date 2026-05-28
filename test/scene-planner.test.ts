import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { OutlineSchema } from '../content/schemas/outline';
import { ScriptSchema } from '../content/schemas/script';
import { LessonSchema } from '../content/schemas/lesson';
import { buildGroundingContext } from '../src/lib/grounding';
import { countWords, estimateDurationFrames, planLesson, FPS, WPM } from '../src/lib/scene-planner';

const ROOT = path.join(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'content', 'tools');

const outline = OutlineSchema.parse(
  JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'lessons', 'module-1', 'outline.json'), 'utf-8')),
);
const script = ScriptSchema.parse(
  JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'lessons', 'module-1', 'script.json'), 'utf-8')),
);
const grounding = buildGroundingContext(outline, TOOLS_DIR);

describe('estimateDurationFrames', () => {
  it('counts words', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('scales with word count above the floor', () => {
    const longText = Array(150).fill('word').join(' '); // 150 words ≈ 60s at 150 WPM
    const frames = estimateDurationFrames(longText, 'cover', FPS, WPM);
    expect(frames).toBeGreaterThan(60 * FPS); // > 60s (spoken + pad)
  });

  it('applies the per-type floor for short narration', () => {
    const frames = estimateDurationFrames('Hi.', 'capability-table', FPS, WPM);
    expect(frames).toBe(6 * FPS); // capability-table floor is 6s
  });
});

describe('planLesson', () => {
  const lesson = planLesson(script, outline, grounding);

  it('produces a LessonSchema-valid lesson (contiguous timing, matching duration)', () => {
    const result = LessonSchema.safeParse(lesson);
    if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2));
    expect(result.success).toBe(true);
  });

  it('creates one scene per script block, in order', () => {
    expect(lesson.scenes).toHaveLength(script.blocks.length);
    expect(lesson.scenes[0].id).toBe(script.blocks[0].id);
  });

  it('attaches narration text to every scene', () => {
    for (const s of lesson.scenes) {
      expect(s.narration?.text).toBeTruthy();
    }
  });

  it('first scene starts at 0 and lesson.duration equals last scene end', () => {
    expect(lesson.scenes[0].start).toBe(0);
    const last = lesson.scenes[lesson.scenes.length - 1];
    expect(lesson.lesson.duration).toBe(last.start + last.duration);
  });

  it('derives capability-table cells from grounding (supported=Y, unsupported=-)', () => {
    const table = lesson.scenes.find((s) => s.type === 'capability-table');
    expect(table).toBeTruthy();
    const content = table!.content as { headers: string[]; rows: { id: string; cells: string[] }[] };
    // Claude column index
    const claudeIdx = content.headers.indexOf('Claude');
    const imageRow = content.rows.find((r) => r.id === 'image-generation');
    // Claude does not support image-generation in the codified facts
    expect(imageRow!.cells[claudeIdx]).toBe('-');
    const writingRow = content.rows.find((r) => r.id === 'writing-chat');
    expect(writingRow!.cells[claudeIdx]).toBe('Y');
  });
});

describe('outline-driven scene content', () => {
  // A beat may carry explicit `content` — the human curriculum layer (outline.json)
  // is authoritative for slide content (STRATEGY.md), so the planner must use it
  // verbatim instead of the hardcoded per-type default. This is what lets a lesson
  // render Instructor's actual journey-map stops / expectations cards rather than a stub.
  const journeyStops = [
    { id: 't0', label: 'Step 1', title: 'Start', state: 'done' },
    { id: 't1', label: 'Step 2', title: 'Middle', state: 'active' },
    { id: 't2', label: 'Step 3', title: 'End', state: 'todo' },
  ];

  const outlineWithContent = OutlineSchema.parse({
    schemaVersion: '1.0',
    id: 'fixture-1',
    lesson: { title: 'How This Course Works', topic: 'Foundations', module: 'Topic 1' },
    sections: [
      {
        id: 'journey',
        title: 'The course journey',
        objective: 'Show where this lesson sits.',
        beats: [
          {
            id: 'journey-map',
            summary: "Instructor's course journey, you-are-here on Topic 1.",
            sceneTypeHint: 'journey-map',
            content: {
              eyebrow: 'Topic 1',
              title: 'The course journey',
              sub: "You're right here.",
              stops: journeyStops,
            },
          },
        ],
      },
    ],
    meta: { createdAt: '2026-05-28', lastUpdated: '2026-05-28', authors: ['test'] },
  });

  const scriptWithContent = ScriptSchema.parse({
    schemaVersion: '1.0',
    lessonId: 'fixture-1',
    blocks: [
      {
        id: 'journey-map',
        sectionId: 'journey',
        beatId: 'journey-map',
        sceneType: 'journey-map',
        narration: 'So here is where you are right now in the course.',
      },
    ],
    meta: { generatedAt: '2026-05-28' },
  });

  it('uses a beat\'s explicit content verbatim instead of the hardcoded default', () => {
    const g = buildGroundingContext(outlineWithContent, TOOLS_DIR);
    const planned = planLesson(scriptWithContent, outlineWithContent, g);
    const scene = planned.scenes[0];
    expect(scene.type).toBe('journey-map');
    expect((scene.content as { stops: unknown[] }).stops).toEqual(journeyStops);
    // not the planner's hardcoded "meet/compare/personalize/practice" default
    expect((scene.content as { stops: { id: string }[] }).stops.map((s) => s.id)).not.toContain(
      'compare',
    );
  });

  it('still produces a LessonSchema-valid lesson from outline-driven content', () => {
    const g = buildGroundingContext(outlineWithContent, TOOLS_DIR);
    const planned = planLesson(scriptWithContent, outlineWithContent, g);
    const result = LessonSchema.safeParse(planned);
    if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2));
    expect(result.success).toBe(true);
  });
});
