/**
 * Stage a rendered lesson MP4 for manual Teachable upload (#28).
 *
 * Teachable has no programmatic upload API, so this is the honest handoff:
 * validate the final render against the brief's constraints, copy it to a
 * clearly-named `publish/<id>.mp4` staging master, and write a manifest a human
 * uses to do the manual upload.
 *
 * Usage: tsx scripts/publish-lesson.ts [lessonId]   (default: module-1)
 *        tsx scripts/publish-lesson.ts module-1 --source out/module-1.mp4
 */
import fs from 'node:fs';
import path from 'node:path';
import { runMain } from '../src/lib/logger';
import { validatePublishCandidate, buildPublishManifest } from '../src/lib/publish';

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

  const publishDir = path.join(process.cwd(), 'publish');
  fs.mkdirSync(publishDir, { recursive: true });
  const destMp4 = path.join(publishDir, `${lessonId}.mp4`);
  fs.copyFileSync(absSource, destMp4);

  const manifest = buildPublishManifest({
    lessonId,
    sourcePath: sourcePath.split(path.sep).join('/'),
    bytes,
    publishedAt: new Date().toISOString(),
  });
  fs.writeFileSync(
    path.join(publishDir, `${lessonId}.manifest.json`),
    JSON.stringify(manifest, null, 2) + '\n',
  );

  log.info('staged for manual Teachable upload', {
    lessonId,
    dest: `publish/${lessonId}.mp4`,
    sizeMb: manifest.sizeMb,
  });
  log.info(manifest.upload);
  return 0;
});
