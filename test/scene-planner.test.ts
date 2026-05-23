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
