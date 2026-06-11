/**
 * Gate T — timing integrity gate.
 *
 *   npm run gate:timing -- <lessonId>
 *
 * Probes the rendered MP4 duration via ffprobe, looks up lesson.minutes from
 * course-map.json (the top-level integer, NOT the sum of row minutes — some
 * lessons have outline row sums larger than their video runtime), runs
 * the pure timing analysis, writes the gate artifact
 * `content/lessons/<id>/review/timing-gate.md` (Verdict: PASS|WARN|FIX), and
 * exits 0 on PASS or WARN, exits 1 on FIX (same convention as gate:layout).
 *
 * Note: Verdict WARN is not matched by parseGateState's /pass|fix|fail/ regex
 * so it counts as not-green for canPublish — intentional. The 0 exit lets
 * CI/CD pipelines distinguish "informational undershoot" from "must fix".
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { runMain } from '../src/lib/logger';
import { runTimingGate } from '../src/lib/gate-timing';

interface CourseMapLesson {
  id: string;
  minutes: number;
  [key: string]: unknown;
}

interface CourseMapTopic {
  id: string;
  lessons: CourseMapLesson[];
  [key: string]: unknown;
}

interface CourseMap {
  topics: CourseMapTopic[];
  [key: string]: unknown;
}

function findLessonMinutes(courseMap: CourseMap, lessonId: string): number | null {
  for (const topic of courseMap.topics) {
    for (const lesson of topic.lessons) {
      if (lesson.id === lessonId) return lesson.minutes;
    }
  }
  return null;
}

function probeDurationSec(mp4Path: string): number {
  const out = execFileSync('ffprobe', [
    '-v', 'quiet',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    mp4Path,
  ], { encoding: 'utf-8' });
  const parsed = parseFloat(out.trim());
  if (isNaN(parsed)) throw new Error(`ffprobe returned non-numeric duration: ${out.trim()}`);
  return parsed;
}

runMain('gate:timing', async (log) => {
  const lessonId = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!lessonId) {
    log.error('usage: npm run gate:timing -- <lessonId>');
    return 1;
  }

  // Locate MP4
  const mp4Path = path.join(process.cwd(), 'out', `${lessonId}.mp4`);
  if (!fs.existsSync(mp4Path)) {
    log.error(`MP4 not found: ${mp4Path}`);
    return 1;
  }

  // Load course-map.json for lesson.minutes
  const courseMapPath = path.join(process.cwd(), 'content', 'curriculum', 'course-map.json');
  if (!fs.existsSync(courseMapPath)) {
    log.error(`course-map.json not found: ${courseMapPath}`);
    return 1;
  }
  const courseMap: CourseMap = JSON.parse(fs.readFileSync(courseMapPath, 'utf-8'));
  const outlineMinutes = findLessonMinutes(courseMap, lessonId);
  if (outlineMinutes == null) {
    log.error(`lessonId "${lessonId}" not found in course-map.json`);
    return 1;
  }

  // Probe MP4 duration
  let durationSec: number;
  try {
    durationSec = probeDurationSec(mp4Path);
  } catch (err) {
    log.error('ffprobe failed', { err });
    return 1;
  }

  log.info(`probed duration`, { lessonId, durationSec, outlineMinutes });

  // Run pure gate logic
  const result = runTimingGate({ lessonId, durationSec, outlineMinutes });

  // Write artifact
  const artifactDir = path.join(process.cwd(), 'content', 'lessons', lessonId, 'review');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'timing-gate.md'), result.artifactMd, 'utf-8');

  log.info(`ratio ${(result.ratio * 100).toFixed(1)}% of outline`, {
    lessonId,
    durationSec: result.durationSec,
    outlineSec: result.outlineSec,
    verdict: result.verdict,
  });

  if (result.verdict === 'PASS') {
    log.info(`Gate T PASS — duration within 75–120% of outline`, { lessonId });
    return 0;
  }
  if (result.verdict === 'WARN') {
    log.warn(`Gate T WARN — duration in warn band (60–130%); exits 0 but blocks publish`, { lessonId });
    return 0;
  }
  // FIX
  log.warn(`Gate T FIX — duration outside 60–130% band`, { lessonId });
  return 1;
});
