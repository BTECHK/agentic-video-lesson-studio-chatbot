/**
 * Package a rendered lesson into a self-contained REVIEW BUNDLE (#45, #28).
 *
 * Async review model: the bundle goes into a Drive-synced (git-ignored) folder;
 * Instructor watches the MP4 in Google Drive and records edits in REVIEW-NOTES.md
 * (timestamp + scene id + change). The tech lead pastes any emailed notes into
 * that same file (it's in git), and Claude Code applies them + re-renders.
 *
 * Teachable has no upload API, so the same MP4 is also the upload-ready master.
 *
 * Bundle layout:  <REVIEW_BUNDLE_DIR>/<id>/
 *   <id>.mp4            the video (watch in Drive)
 *   script-reference.md scene-by-scene narration (cite scenes by id)
 *   manifest.json       version stamp (scriptHash → detects video/script drift)
 *   REVIEW-NOTES.md     reviewer's notes (NEVER overwritten if it exists)
 *
 * Usage: tsx scripts/publish-lesson.ts [lessonId] [--source out/<id>.mp4]
 *   REVIEW_BUNDLE_DIR env points at the Drive-synced folder (default: ./publish)
 */
import fs from 'node:fs';
import path from 'node:path';
import { runMain } from '../src/lib/logger';
import {
  validatePublishCandidate,
  buildBundleManifest,
  scriptReferenceMarkdown,
  reviewNotesTemplate,
  hashScript,
  type ScriptBlock,
} from '../src/lib/publish';

runMain('publish', async (log) => {
  const lessonId = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'module-1';
  const sourceFlag = process.argv.indexOf('--source');
  const sourcePath =
    sourceFlag !== -1 && process.argv[sourceFlag + 1]
      ? process.argv[sourceFlag + 1]
      : path.join('out', `${lessonId}.mp4`);

  const absSource = path.join(process.cwd(), sourcePath);
  const exists = fs.existsSync(absSource);
  const bytes = exists ? fs.statSync(absSource).size : 0;

  const check = validatePublishCandidate({ exists, bytes });
  if (!check.ok) {
    for (const e of check.errors) log.error(e, { lessonId, sourcePath });
    return 1;
  }

  // Source content for the version stamp + script reference.
  const lessonDir = path.join(process.cwd(), 'content', 'lessons', lessonId);
  const scriptPath = path.join(lessonDir, 'script.json');
  let blocks: ScriptBlock[] = [];
  let scriptHash = 'no-script';
  if (fs.existsSync(scriptPath)) {
    const raw = fs.readFileSync(scriptPath, 'utf-8');
    scriptHash = hashScript(raw);
    const parsed = JSON.parse(raw) as { blocks?: ScriptBlock[] };
    blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
  } else {
    log.warn('no script.json — bundle will omit the script reference', { lessonId });
  }

  let title = lessonId;
  const lessonJson = path.join(lessonDir, 'lesson.json');
  if (fs.existsSync(lessonJson)) {
    const l = JSON.parse(fs.readFileSync(lessonJson, 'utf-8')) as { lesson?: { title?: string } };
    title = l.lesson?.title ?? lessonId;
  }

  // Bundle dir (Drive-synced; git-ignored). Override with REVIEW_BUNDLE_DIR.
  const baseDir = process.env.REVIEW_BUNDLE_DIR
    ? path.resolve(process.env.REVIEW_BUNDLE_DIR)
    : path.join(process.cwd(), 'publish');
  const bundleDir = path.join(baseDir, lessonId);
  fs.mkdirSync(bundleDir, { recursive: true });

  const videoFile = `${lessonId}.mp4`;
  fs.copyFileSync(absSource, path.join(bundleDir, videoFile));

  if (blocks.length > 0) {
    fs.writeFileSync(
      path.join(bundleDir, 'script-reference.md'),
      scriptReferenceMarkdown(lessonId, title, blocks),
    );
  }

  const manifest = buildBundleManifest({
    lessonId,
    title,
    videoFile,
    bytes,
    publishedAt: new Date().toISOString(),
    scriptHash,
    blockCount: blocks.length,
  });
  fs.writeFileSync(path.join(bundleDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  // Never clobber existing reviewer notes — only seed the template once.
  const notesPath = path.join(bundleDir, 'REVIEW-NOTES.md');
  if (!fs.existsSync(notesPath)) {
    fs.writeFileSync(notesPath, reviewNotesTemplate(lessonId, title));
  }

  log.info('review bundle ready', {
    lessonId,
    bundle: path.relative(process.cwd(), bundleDir),
    sizeMb: manifest.sizeMb,
    scriptHash,
  });
  log.info('Share via the Drive-synced folder; reviewer fills REVIEW-NOTES.md.');
  return 0;
});
