/**
 * Publish a gate-green lesson's learning artifacts to the exec-facing Google
 * Drive Curriculum tree (Module N / Lesson N.M / {Video, Script, Lesson Plan}).
 *
 *   npm run publish:drive -- <lessonId> [--source out/<id>.mp4] [--force]
 *
 * Drive root is a per-machine VARIABLE (DRIVE_CURRICULUM_DIR env or drive.local.json) —
 * Windows (Tech Lead) and macOS (Instructor) mount Google Drive at different paths.
 *
 * Robust to the real failure modes: Drive not mounted / path moved / offline /
 * read-only. Never half-writes silently; every failure is a clear, actionable error.
 *
 * Precondition: A·B·C·L all green (npm run gate:status) unless --force. Only
 * learning material is copied — no JSON, code, or planning docs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { runMain } from '../src/lib/logger';
import { resolveCurriculumDir, lessonDriveTarget, pickFolder } from '../src/lib/drive-publish';
import { summarizeGates, canPublish } from '../src/lib/gate-status';
import type { CourseMap } from '../src/lib/course-map';

function readConfigFile(): { curriculumDir?: string } | null {
  const p = path.join(process.cwd(), 'drive.local.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

/** Verify the Drive root is actually there and writable (catches the unmounted /
 * moved-path / offline cases before we copy anything). */
function checkDriveRoot(dir: string): { ok: boolean; error?: string } {
  let st: fs.Stats;
  try {
    st = fs.statSync(dir);
  } catch {
    return {
      ok: false,
      error:
        `Drive curriculum path not found: ${dir}\n` +
        '  → Is Google Drive running and the shared drive mounted? Has the path changed?\n' +
        '  → Update DRIVE_CURRICULUM_DIR or drive.local.json to the current path.',
    };
  }
  if (!st.isDirectory()) return { ok: false, error: `Not a directory: ${dir}` };
  try {
    fs.accessSync(dir, fs.constants.W_OK);
  } catch {
    return { ok: false, error: `Drive path is not writable (permissions / read-only mount): ${dir}` };
  }
  return { ok: true };
}

runMain('publish:drive', async (log) => {
  const args = process.argv.slice(2);
  const lessonId = args.find((a) => !a.startsWith('--'));
  const force = args.includes('--force');
  if (!lessonId) {
    log.error('usage: npm run publish:drive -- <lessonId> [--source out/<id>.mp4] [--force]');
    return 1;
  }
  const srcFlag = args.indexOf('--source');
  const sourcePath =
    srcFlag !== -1 && args[srcFlag + 1] ? args[srcFlag + 1] : path.join('out', `${lessonId}.mp4`);

  // 1. Resolve the per-machine Drive root.
  const res = resolveCurriculumDir({ env: process.env.DRIVE_CURRICULUM_DIR, configFile: readConfigFile() });
  if (!res.ok) {
    log.error(res.error!);
    return 1;
  }
  const curriculumDir = res.dir!;

  // 2. Drive reachable + writable?
  const rootCheck = checkDriveRoot(curriculumDir);
  if (!rootCheck.ok) {
    log.error(rootCheck.error!);
    return 1;
  }

  // 3. Map lesson → exec folders.
  const mapPath = path.join(process.cwd(), 'content', 'curriculum', 'course-map.json');
  if (!fs.existsSync(mapPath)) {
    log.error('course-map.json not found — run npm run compile:course-map first.');
    return 1;
  }
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf-8')) as CourseMap;
  const target = lessonDriveTarget(map, lessonId);
  if (!target) {
    log.error(`lesson "${lessonId}" not found in course-map — cannot resolve its Module/Lesson folder.`);
    return 1;
  }

  // 4. Gate precondition (A·B·C·L) unless forced.
  const lessonDir = path.join(process.cwd(), 'content', 'lessons', lessonId);
  const read = (rel: string) => {
    const p = path.join(lessonDir, rel);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
  };
  const gates = summarizeGates(lessonId, {
    A: read('review/FACT-CHECK-REPORT.md'),
    B: read('review/teaching-axis.md'),
    C: read('review/watch-gate.md'),
    L: read('review/layout-gate.md'),
    T: read('review/timing-gate.md'),
  });
  const decision = canPublish(gates);
  if (!decision.ok && !force) {
    for (const r of decision.reasons) log.warn(r);
    log.error(`Refusing to publish ${lessonId} — gates not all green. Re-run with --force to override.`);
    return 1;
  }
  if (!decision.ok && force) log.warn(`--force: publishing ${lessonId} despite non-green gates.`);

  // 5. Source video present?
  const absSource = path.isAbsolute(sourcePath) ? sourcePath : path.join(process.cwd(), sourcePath);
  if (!fs.existsSync(absSource)) {
    log.error(`source video not found: ${absSource} — render the lesson first.`);
    return 1;
  }

  // 6. Resolve/create Module + Lesson folders (match existing by prefix; tolerate title drift).
  const moduleFolder = pickFolder(safeList(curriculumDir), target.modulePrefix, target.moduleFolder);
  const moduleDir = path.join(curriculumDir, moduleFolder);
  const lessonFolder = pickFolder(safeList(moduleDir), target.lessonPrefix, target.lessonFolder);
  const destDir = path.join(moduleDir, lessonFolder);

  try {
    fs.mkdirSync(destDir, { recursive: true });

    // Video (the artifact too big for git).
    copyAtomic(absSource, path.join(destDir, target.artifacts.video));

    // Lesson plan (markdown — learning material; PDF conversion is a future step).
    const planSrc = path.join(lessonDir, 'lesson-plan.md');
    if (fs.existsSync(planSrc)) {
      copyAtomic(planSrc, path.join(destDir, `${target.artifacts.plan}.md`));
    } else {
      log.warn('no lesson-plan.md to copy', { lessonId });
    }

    // Script (the spoken narration). Prefer a review-bundle script-reference.md if one exists;
    // otherwise derive it from the lesson's own script.json so EVERY lesson ships a Script
    // alongside its Video + Lesson Plan (architectural consistency — see Drive delivery contract).
    const scriptDest = path.join(destDir, `${target.artifacts.script}.md`);
    const bundledScript = path.join(process.cwd(), 'publish', lessonId, 'script-reference.md');
    if (fs.existsSync(bundledScript)) {
      copyAtomic(bundledScript, scriptDest);
    } else {
      const derived = buildScriptReference(lessonDir);
      if (derived) {
        const tmp = `${scriptDest}.part`;
        fs.writeFileSync(tmp, derived, 'utf-8');
        fs.renameSync(tmp, scriptDest);
      } else {
        log.warn('no script.json to derive a Script from', { lessonId });
      }
    }
  } catch (err) {
    // Connection drops / Drive eviction mid-copy land here — report, don't crash silently.
    log.error(`publish failed during copy (Drive may have disconnected): ${(err as Error).message}`, {
      lessonId,
      destDir,
    });
    return 1;
  }

  log.info('published to Drive', {
    lessonId,
    module: moduleFolder,
    lesson: lessonFolder,
    forced: force && !decision.ok,
  });
  return 0;
});

function safeList(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

/**
 * Build a readable Script (the spoken voiceover) from a lesson's script.json, so every lesson
 * ships a Script even when no review-bundle script-reference.md was produced. Returns null if
 * there's no usable script.json.
 */
function buildScriptReference(lessonDir: string): string | null {
  const scriptPath = path.join(lessonDir, 'script.json');
  if (!fs.existsSync(scriptPath)) return null;
  let data: { lessonId?: string; blocks?: { id?: string; narration?: string }[] };
  try {
    data = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
  } catch {
    return null;
  }
  const blocks = data.blocks ?? [];
  if (blocks.length === 0) return null;

  let title = data.lessonId ?? 'Lesson';
  const outlinePath = path.join(lessonDir, 'outline.json');
  if (fs.existsSync(outlinePath)) {
    try {
      const o = JSON.parse(fs.readFileSync(outlinePath, 'utf-8')) as { lesson?: { title?: string } };
      if (o.lesson?.title) title = o.lesson.title;
    } catch {
      /* fall back to lessonId */
    }
  }

  const body = blocks
    .map((b) => `### ${b.id ?? ''}\n\n${(b.narration ?? '').trim()}`)
    .join('\n\n');
  return `# ${title} — Script\n\n_Spoken narration (voiceover), in order. Generated from the lesson script._\n\n${body}\n`;
}

/** Copy via a temp file + rename so a dropped connection never leaves a truncated MP4. */
function copyAtomic(src: string, dest: string): void {
  const tmp = `${dest}.part`;
  fs.copyFileSync(src, tmp);
  fs.renameSync(tmp, dest);
}
