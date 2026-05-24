import 'server-only';
import fs from 'fs';
import path from 'path';

const LESSONS_DIR = path.join(process.cwd(), '..', 'content', 'lessons');

export interface OutlineSummary {
  lessonId: string;
  title: string;
  audience?: string;
  sections: { title: string; objective?: string; beats: number }[];
  hasDraft: boolean;
}

interface OutlineDoc {
  lesson?: { title?: string };
  audience?: string;
  sections?: { title?: string; objective?: string; beats?: unknown[] }[];
}

/** A high-level summary of the outline the script will be generated from. */
export function getOutlineSummary(lessonId: string): OutlineSummary | null {
  const dir = path.join(LESSONS_DIR, lessonId);
  const outlinePath = path.join(dir, 'outline.json');
  if (!fs.existsSync(outlinePath)) return null;

  const doc = JSON.parse(fs.readFileSync(outlinePath, 'utf-8')) as OutlineDoc;
  return {
    lessonId,
    title: doc.lesson?.title ?? lessonId,
    audience: doc.audience,
    sections: (doc.sections ?? []).map((s) => ({
      title: s.title ?? 'Untitled section',
      objective: s.objective,
      beats: s.beats?.length ?? 0,
    })),
    hasDraft: fs.existsSync(path.join(dir, 'script.draft.json')),
  };
}
