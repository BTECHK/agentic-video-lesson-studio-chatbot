import { readFileSync } from 'node:fs';
import { LessonSchema } from '../content/schemas/lesson';

/**
 * Falsifiable per-file gate for authored lesson.json (the design->render conversion
 * step). Parses ONE lesson.json against the full LessonSchema (envelope + strict
 * per-scene content via superRefine + timeline invariants). Exit 0 = VALID.
 *   tsx scripts/validate-lesson-json.ts <path-to-lesson.json>
 */
const path = process.argv[2];
if (!path) {
  console.error('usage: tsx scripts/validate-lesson-json.ts <lesson.json>');
  process.exit(2);
}

let data: unknown;
try {
  data = JSON.parse(readFileSync(path, 'utf-8'));
} catch (e) {
  console.error('UNPARSEABLE', path, '-', (e as Error).message);
  process.exit(1);
}

const r = LessonSchema.safeParse(data);
if (!r.success) {
  console.error('INVALID', path);
  for (const i of r.error.issues) console.error('  -', i.path.join('.'), ':', i.message);
  process.exit(1);
}

// Timeline contiguity check (start[i]+duration == start[i+1]); first scene start 0.
const scenes = r.data.scenes;
let contiguous = scenes[0].start === 0;
for (let i = 0; i < scenes.length - 1; i++) {
  if (scenes[i].start + scenes[i].duration !== scenes[i + 1].start) contiguous = false;
}
const words = scenes.reduce((n, s) => n + (s.narration?.text?.trim().split(/\s+/).filter(Boolean).length ?? 0), 0);
console.log(
  `VALID ${path} | ${scenes.length} scenes | ${words} narration words | timeline ${contiguous ? 'contiguous' : 'NON-CONTIGUOUS (align will re-time)'}`,
);
