/**
 * Export burned-in-caption-matching .srt sidecar files for every lesson that
 * has word-level narration alignment. Reuses `narrationToPages` (the same
 * pagination `LessonCaptions` uses) so .srt cues line up with what's on
 * screen. Lessons with narration (text or `audioSrc`) but no `words` (not yet
 * aligned) are skipped and listed in the report as needing `npm run align:lesson`.
 *
 * Usage: npx tsx scripts/export-captions.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { narrationToPages } from '../src/lib/captions';
import { loadLesson } from '../src/lib/content-loader';
import { BRAND } from '../src/brand/tokens';
import type { Lesson } from '../content/schemas/lesson';

export interface SrtCue {
  startMs: number;
  endMs: number;
  text: string;
}

/** Frames (at project fps) -> milliseconds. */
function framesToMs(frames: number): number {
  return (frames / BRAND.video.fps) * 1000;
}

/**
 * Build sequential, monotonic non-overlapping SRT cues for one lesson from
 * its scenes' word-level narration. Each scene's word timestamps are
 * scene-relative, so pages are offset by the scene's start (frames -> ms).
 * Scenes without `narration.words` are skipped (no cues emitted for them).
 * Default `combineMs` (1400) matches `LessonCaptions`' page window so the
 * sidecar cues line up with the burned-in captions.
 */
export function buildLessonCues(lesson: Lesson, combineMs: number = 1400): SrtCue[] {
  const cues: SrtCue[] = [];
  for (const scene of lesson.scenes) {
    const words = scene.narration?.words;
    if (!words || words.length === 0) continue;
    const offsetMs = framesToMs(scene.start);
    const pages = narrationToPages(words, combineMs);
    for (const page of pages) {
      const text = page.text.trim();
      const startMs = offsetMs + page.startMs;
      const endMs = offsetMs + page.durationMs + page.startMs;
      if (!text || endMs <= startMs) continue;
      cues.push({ startMs, endMs, text });
    }
  }

  // Enforce monotonic, non-overlapping cues: truncate a cue's end to the
  // next cue's start if they overlap, and drop any cue that collapses to
  // zero (or negative) length as a result.
  const clamped: SrtCue[] = [];
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const next = cues[i + 1];
    const endMs = next ? Math.min(cue.endMs, next.startMs) : cue.endMs;
    if (endMs <= cue.startMs) continue;
    clamped.push({ ...cue, endMs });
  }
  return clamped;
}

/** ms -> SRT timestamp `HH:MM:SS,mmm`. */
function formatSrtTimestamp(ms: number): string {
  const total = Math.max(0, Math.round(ms));
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  const millis = total % 1000;
  const pad = (n: number, len: number) => String(n).padStart(len, '0');
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(millis, 3)}`;
}

/** Serialize cues into an .srt file body. */
export function cuesToSrt(cues: SrtCue[]): string {
  return cues
    .map((cue, i) => {
      const index = i + 1;
      const timing = `${formatSrtTimestamp(cue.startMs)} --> ${formatSrtTimestamp(cue.endMs)}`;
      return `${index}\n${timing}\n${cue.text}\n`;
    })
    .join('\n');
}

interface LessonResult {
  lessonId: string;
  scenes: number;
  cues: number;
  status: 'exported' | 'no-words';
  needsAlignment: boolean;
}

async function main() {
  const lessonsDir = path.join(process.cwd(), 'content/lessons');
  const outDir = path.join(process.cwd(), 'out/captions');
  fs.mkdirSync(outDir, { recursive: true });

  const lessonIds = fs
    .readdirSync(lessonsDir)
    .filter((d) => fs.existsSync(path.join(lessonsDir, d, 'lesson.json')))
    .sort();

  const results: LessonResult[] = [];

  for (const lessonId of lessonIds) {
    const lesson = await loadLesson(path.join(lessonsDir, lessonId, 'lesson.json'));
    const cues = buildLessonCues(lesson);
    // A lesson "needs alignment" when it carries narration (spoken text or an
    // audio track) yet no scene has word-level timings — so it should have
    // captions once `align:lesson` runs, but currently produces none.
    const needsAlignment = lesson.scenes.some(
      (s) => (s.narration?.audioSrc || s.narration?.text) && (!s.narration.words || s.narration.words.length === 0),
    );

    if (cues.length === 0) {
      results.push({ lessonId, scenes: lesson.scenes.length, cues: 0, status: 'no-words', needsAlignment });
      continue;
    }

    fs.writeFileSync(path.join(outDir, `${lessonId}.srt`), cuesToSrt(cues), 'utf-8');
    results.push({ lessonId, scenes: lesson.scenes.length, cues: cues.length, status: 'exported', needsAlignment });
  }

  const exported = results.filter((r) => r.status === 'exported');
  const skipped = results.filter((r) => r.status === 'no-words');
  const needsAlignment = results.filter((r) => r.needsAlignment);

  const reportLines: string[] = [
    '# Caption Export Report',
    '',
    '| lessonId | scenes | cues | status |',
    '| --- | --- | --- | --- |',
    ...results.map((r) => `| ${r.lessonId} | ${r.scenes} | ${r.cues} | ${r.status} |`),
    '',
    '## Needs alignment',
    '',
    ...(needsAlignment.length === 0
      ? ['None — every lesson with narration already has word-level alignment.']
      : needsAlignment.map(
          (r) => `- NO WORDS — needs alignment run (\`npm run align:lesson -- ${r.lessonId}\`)`,
        )),
    '',
  ];
  fs.writeFileSync(path.join(outDir, 'REPORT.md'), reportLines.join('\n'), 'utf-8');

  console.log(`[export-captions] ${exported.length} lesson(s) exported, ${skipped.length} skipped (no words)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
