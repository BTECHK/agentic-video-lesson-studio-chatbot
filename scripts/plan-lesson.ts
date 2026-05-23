import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OutlineSchema } from '../content/schemas/outline';
import { ScriptSchema } from '../content/schemas/script';
import { LessonSchema } from '../content/schemas/lesson';
import { buildGroundingContext } from '../src/lib/grounding';
import { planLesson, FPS } from '../src/lib/scene-planner';

/**
 * Scene-planning CLI (PLAN-01).
 *   tsx scripts/plan-lesson.ts <lessonId>
 * Reads outline.json + script.json, derives a LessonSchema-valid lesson.json(draft) with
 * estimated (pre-audio) durations and grounding-derived scene content, validates, and writes it.
 */

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const root = join(import.meta.dirname!, '..');
const lessonId = process.argv[2];
if (!lessonId) {
  console.error('Usage: tsx scripts/plan-lesson.ts <lessonId>');
  process.exit(1);
}

const lessonDir = join(root, 'content', 'lessons', lessonId);
const outlinePath = join(lessonDir, 'outline.json');
const scriptPath = join(lessonDir, 'script.json');
const lessonPath = join(lessonDir, 'lesson.json');

for (const [label, p] of [['outline', outlinePath], ['script', scriptPath]] as const) {
  if (!existsSync(p)) {
    console.error(`${RED}No ${label} at ${p}${RESET}`);
    process.exit(1);
  }
}

const outline = OutlineSchema.parse(JSON.parse(readFileSync(outlinePath, 'utf-8')));
const script = ScriptSchema.parse(JSON.parse(readFileSync(scriptPath, 'utf-8')));
const grounding = buildGroundingContext(outline);

const lesson = planLesson(script, outline, grounding);

const result = LessonSchema.safeParse(lesson);
if (!result.success) {
  console.error(`${RED}Planned lesson failed LessonSchema:${RESET}`);
  for (const issue of result.error.issues) console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

writeFileSync(lessonPath, JSON.stringify(lesson, null, 2) + '\n', 'utf-8');
const totalSeconds = (lesson.lesson.duration / FPS).toFixed(1);
console.log(`${BOLD}lesson.json written:${RESET} ${lessonPath}`);
console.log(`${GREEN}Valid${RESET} — ${lesson.scenes.length} scenes, ~${totalSeconds}s estimated (pre-audio).`);
