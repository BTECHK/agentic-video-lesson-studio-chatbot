import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OutlineSchema } from '../content/schemas/outline';
import { ScriptSchema } from '../content/schemas/script';
import { LessonSchema } from '../content/schemas/lesson';
import { buildGroundingContext } from '../src/lib/grounding';
import { planLesson, FPS } from '../src/lib/scene-planner';
import { runMain, type Logger } from '../src/lib/logger';

/**
 * Scene-planning CLI (PLAN-01).
 *   tsx scripts/plan-lesson.ts <lessonId>
 * Reads outline.json + script.json, derives a LessonSchema-valid lesson.json(draft) with
 * estimated (pre-audio) durations and grounding-derived scene content, validates, and writes it.
 */

function main(log: Logger): number {
  const root = join(import.meta.dirname!, '..');
  const lessonId = process.argv[2];
  if (!lessonId) {
    log.error('usage: tsx scripts/plan-lesson.ts <lessonId>');
    return 1;
  }

  const lessonDir = join(root, 'content', 'lessons', lessonId);
  const outlinePath = join(lessonDir, 'outline.json');
  const scriptPath = join(lessonDir, 'script.json');
  const lessonPath = join(lessonDir, 'lesson.json');

  for (const [label, p] of [['outline', outlinePath], ['script', scriptPath]] as const) {
    if (!existsSync(p)) {
      log.error(`no ${label} found`, { lessonId, path: p });
      return 1;
    }
  }

  const outline = OutlineSchema.parse(JSON.parse(readFileSync(outlinePath, 'utf-8')));
  const script = ScriptSchema.parse(JSON.parse(readFileSync(scriptPath, 'utf-8')));
  const grounding = buildGroundingContext(outline);

  const lesson = planLesson(script, outline, grounding);

  const result = LessonSchema.safeParse(lesson);
  if (!result.success) {
    log.error('planned lesson failed LessonSchema', {
      lessonId,
      issues: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return 1;
  }

  writeFileSync(lessonPath, JSON.stringify(lesson, null, 2) + '\n', 'utf-8');
  log.info('lesson.json written', {
    lessonId,
    lessonPath,
    scenes: lesson.scenes.length,
    estimatedSeconds: Number((lesson.lesson.duration / FPS).toFixed(1)),
  });
  return 0;
}

runMain('plan', main);
