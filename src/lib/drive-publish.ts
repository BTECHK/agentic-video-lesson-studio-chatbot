/**
 * Publish a gate-green lesson's learning artifacts into the exec-facing Google
 * Drive Curriculum tree (the Module/Lesson folders Instructor & stakeholders browse).
 *
 * Cross-machine by design: the Drive root is a VARIABLE, never hardcoded — Tech Lead
 * is on Windows (`G:\.shortcut-targets-by-id\...`), Instructor is on a Mac (a totally
 * different mount path). Resolution order (first hit wins):
 *   1. env DRIVE_CURRICULUM_DIR
 *   2. drive.local.json  { "curriculumDir": "..." }   (git-ignored, per-machine)
 *   3. (none) -> a typed error telling the user exactly how to set it
 *
 * Pure + testable: no fs here beyond what callers inject. The CLI
 * (scripts/publish-to-drive.ts) wires this to the filesystem with error handling
 * for "Drive not mounted / path moved / offline".
 */
import type { CourseMap } from './course-map';

export interface CurriculumResolution {
  ok: boolean;
  dir?: string;
  error?: string;
}

/** Resolve the Drive curriculum root from env or a per-machine config object. */
export function resolveCurriculumDir(opts: {
  env?: string;
  configFile?: { curriculumDir?: string } | null;
}): CurriculumResolution {
  const fromEnv = opts.env?.trim();
  if (fromEnv) return { ok: true, dir: fromEnv };
  const fromCfg = opts.configFile?.curriculumDir?.trim();
  if (fromCfg) return { ok: true, dir: fromCfg };
  return {
    ok: false,
    error:
      'Drive curriculum path not set. Set env DRIVE_CURRICULUM_DIR, or create drive.local.json ' +
      'with {"curriculumDir":"<path to .../Content Development/Curriculum>"}. ' +
      'Windows e.g. G:\\.shortcut-targets-by-id\\<id>\\Content Development\\Curriculum ; ' +
      'macOS e.g. /Users/<you>/Library/CloudStorage/GoogleDrive-<acct>/.shortcut-targets-by-id/<id>/Content Development/Curriculum',
  };
}

export interface LessonDriveTarget {
  moduleNumber: number;
  lessonNumber: string; // "1.3"
  /** preferred folder names (canonical), used when no existing folder matches */
  moduleFolder: string;
  lessonFolder: string;
  /** prefix used to find an EXISTING folder regardless of title punctuation */
  modulePrefix: string; // "Module 1"
  lessonPrefix: string; // "Lesson 1.3"
  artifacts: { video: string; script: string; plan: string };
}

/** Map a repo lessonId (topic-N-lesson-M) to its exec-facing Drive location. */
export function lessonDriveTarget(map: CourseMap, lessonId: string): LessonDriveTarget | null {
  for (const topic of map.topics) {
    const lesson = topic.lessons.find((l) => l.id === lessonId);
    if (!lesson) continue;
    const n = topic.number;
    const num = lesson.number; // "1.3"
    return {
      moduleNumber: n,
      lessonNumber: num,
      moduleFolder: `Module ${n} — ${topic.title}`,
      lessonFolder: `Lesson ${num} — ${lesson.title}`,
      modulePrefix: `Module ${n}`,
      lessonPrefix: `Lesson ${num}`,
      artifacts: {
        video: `${num} Video.mp4`,
        script: `${num} Script`,
        plan: `${num} Lesson Plan`,
      },
    };
  }
  return null;
}

/**
 * Given the existing directory entries, pick the folder that matches a prefix
 * (so "Module 1 — Getting Started with AI Assistants" matches "Module 1 —"
 * even if the course-map title uses "+"/different punctuation). Falls back to the
 * canonical name when nothing matches (caller then creates it).
 */
export function pickFolder(existing: string[], prefix: string, canonical: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const p = norm(prefix);
  const hit = existing.find((e) => norm(e).startsWith(p));
  return hit ?? canonical;
}
