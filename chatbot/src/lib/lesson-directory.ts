import 'server-only';
import fs from 'fs';
import path from 'path';
import { getLessonTimeline, listLessonIds } from './lesson-timeline';
import { getLessonClassification, type LessonClassification } from './lesson-classification';
import { TRACK_KINDS } from './studio-timeline';

const LESSONS_DIR = path.join(process.cwd(), '..', 'content', 'lessons');

export interface LessonDirEntry {
  lessonId: string;
  title: string;
  classification: LessonClassification;
  classificationBadge: string;
  classificationNote?: string;
  scenes: number;
  durationSec: number;
  staleCount: number;
  hasDraft: boolean;
  hasVideo: boolean;
}

/** Directory of all lessons with at-a-glance status — backs the Studio Menu. */
export function getLessonDirectory(): LessonDirEntry[] {
  return listLessonIds()
    .map((lessonId): LessonDirEntry | null => {
      const t = getLessonTimeline(lessonId);
      if (!t) return null;
      const staleCount = TRACK_KINDS.flatMap((k) => t.tracks[k]).filter((c) => c.status === 'stale').length;
      const dir = path.join(LESSONS_DIR, lessonId);
      const classification = getLessonClassification(lessonId);
      return {
        lessonId,
        title: t.title,
        classification: classification.classification,
        classificationBadge: classification.badge,
        classificationNote: classification.note,
        scenes: t.tracks.animation.length,
        durationSec: t.durationSec,
        staleCount,
        hasDraft: fs.existsSync(path.join(dir, 'script.draft.json')),
        hasVideo: fs.existsSync(path.join(process.cwd(), '..', 'out', `${lessonId}.mp4`)),
      };
    })
    .filter((e): e is LessonDirEntry => e !== null);
}
