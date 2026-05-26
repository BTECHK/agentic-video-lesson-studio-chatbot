import 'server-only';
import fs from 'fs';
import path from 'path';
import { lessonToTimeline, type LessonDoc, type StatusMap, type LessonTimeline } from './studio-timeline';

const LESSONS_DIR = path.join(process.cwd(), '..', 'content', 'lessons');

/**
 * Load a lesson's timeline for the Studio. Status is derived truthfully from the
 * filesystem: a scene's voiceover is `stale` when its synthesized .wav has not
 * been generated locally (the regeneration DAG would rebuild it). Captions stay
 * fresh — their word timings live in lesson.json and are already committed.
 */
export function getLessonTimeline(lessonId: string): LessonTimeline | null {
  const file = path.join(LESSONS_DIR, lessonId, 'lesson.json');
  if (!fs.existsSync(file)) return null;

  const doc = JSON.parse(fs.readFileSync(file, 'utf-8')) as LessonDoc;
  return lessonToTimeline(doc, deriveStatus(lessonId, doc));
}

function deriveStatus(lessonId: string, doc: LessonDoc): StatusMap {
  const status: StatusMap = {};
  const audioDir = path.join(LESSONS_DIR, lessonId, 'audio');
  for (const scene of doc.scenes) {
    const narration = scene.narration ?? scene.content?.narration;
    if (!narration?.text) continue;
    const wav = path.join(audioDir, `scene-${scene.id}.wav`);
    if (!fs.existsSync(wav)) {
      status[`voice-${scene.id}`] = { status: 'stale', reason: 'Audio not generated yet' };
    }
  }
  return status;
}

/** The lessons that have a lesson.json on disk (for the Studio picker / default). */
export function listLessonIds(): string[] {
  if (!fs.existsSync(LESSONS_DIR)) return [];
  return fs
    .readdirSync(LESSONS_DIR, { withFileTypes: true })
    // Skip underscore-prefixed dirs (e.g. _scene-preview) — internal QA
    // fixtures, not real lessons; they shouldn't appear in the console.
    .filter(
      (d) =>
        d.isDirectory() &&
        !d.name.startsWith('_') &&
        fs.existsSync(path.join(LESSONS_DIR, d.name, 'lesson.json')),
    )
    .map((d) => d.name);
}
