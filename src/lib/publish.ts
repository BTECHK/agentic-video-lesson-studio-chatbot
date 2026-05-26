/**
 * Teachable publish/staging helpers (#28).
 *
 * Teachable has no programmatic video-upload API (the public API is read-only
 * for content and gated behind a paid tier), so the pipeline's handoff is a
 * manual one: render -> validate -> stage an upload-ready master under
 * `publish/<id>.mp4`, then a human drags it into the Teachable course. These
 * pure helpers do the validation and manifest building; the fs/copy work lives
 * in scripts/publish-lesson.ts.
 */

/** Teachable lesson video hard limit from the project brief (2 GB). */
export const TEACHABLE_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export interface PublishCandidate {
  exists: boolean;
  bytes: number;
}

export interface PublishCheck {
  ok: boolean;
  errors: string[];
}

export function validatePublishCandidate(c: PublishCandidate): PublishCheck {
  const errors: string[] = [];
  if (!c.exists) {
    errors.push('Source render not found — render the lesson MP4 first.');
    return { ok: false, errors };
  }
  if (c.bytes <= 0) {
    errors.push('Source render is empty (0 bytes).');
  }
  if (c.bytes > TEACHABLE_MAX_BYTES) {
    errors.push(
      `Source render is ${(c.bytes / 1024 / 1024 / 1024).toFixed(2)} GB — exceeds the Teachable 2GB limit.`,
    );
  }
  return { ok: errors.length === 0, errors };
}

export interface PublishManifestInput {
  lessonId: string;
  sourcePath: string;
  bytes: number;
  publishedAt: string;
}

export interface PublishManifest {
  lessonId: string;
  target: 'teachable';
  status: 'ready-for-upload';
  source: string;
  bytes: number;
  sizeMb: number;
  publishedAt: string;
  upload: string;
}

export function buildPublishManifest(input: PublishManifestInput): PublishManifest {
  return {
    lessonId: input.lessonId,
    target: 'teachable',
    status: 'ready-for-upload',
    source: input.sourcePath,
    bytes: input.bytes,
    sizeMb: Math.round((input.bytes / 1024 / 1024) * 100) / 100,
    publishedAt: input.publishedAt,
    upload:
      'Manual: Teachable has no video-upload API. In the Teachable admin, open the ' +
      'course → section → lesson and upload this MP4 via the lesson video block.',
  };
}

// ── Review bundle (#45) ──────────────────────────────────────────────────────
//
// A self-contained per-lesson folder shared via the Drive-synced media dir:
// the MP4, a human-readable script reference, a version-stamped manifest, and a
// REVIEW-NOTES.md template. The scriptHash stamps which script the video was
// rendered from, so we can detect "video is stale vs script" drift.

import { createHash } from 'node:crypto';

export interface ScriptBlock {
  id: string;
  narration: string;
}

/** Short, stable content hash of the script — the bundle's version stamp. */
export function hashScript(scriptJson: string): string {
  return createHash('sha256').update(scriptJson).digest('hex').slice(0, 12);
}

export interface BundleManifestInput {
  lessonId: string;
  title: string;
  videoFile: string;
  bytes: number;
  publishedAt: string;
  scriptHash: string;
  blockCount: number;
}

export interface BundleManifest {
  lessonId: string;
  title: string;
  status: 'ready-for-review';
  video: string;
  bytes: number;
  sizeMb: number;
  scriptHash: string;
  blocks: number;
  publishedAt: string;
  review: string;
  teachable: string;
}

export function buildBundleManifest(input: BundleManifestInput): BundleManifest {
  return {
    lessonId: input.lessonId,
    title: input.title,
    status: 'ready-for-review',
    video: input.videoFile,
    bytes: input.bytes,
    sizeMb: Math.round((input.bytes / 1024 / 1024) * 100) / 100,
    scriptHash: input.scriptHash,
    blocks: input.blockCount,
    publishedAt: input.publishedAt,
    review:
      'Watch the MP4 in Google Drive; record edits in REVIEW-NOTES.md (timestamp + scene id + change). ' +
      'scriptHash stamps the script this video was rendered from — if the script changes, re-render before re-reviewing.',
    teachable:
      'After approval this same MP4 is the upload-ready master — manual upload (Teachable has no upload API).',
  };
}

/** Human-readable scene-by-scene script so a reviewer can cite scenes by id. */
export function scriptReferenceMarkdown(lessonId: string, title: string, blocks: ScriptBlock[]): string {
  const body = blocks
    .map((b) => `## ${b.id}\n\n${b.narration.trim()}`)
    .join('\n\n');
  return `# ${title} — script reference (${lessonId})\n\nReview reference. Cite scenes by their id (below) plus a timestamp in REVIEW-NOTES.md.\n\n${body}\n`;
}

/** Template the reviewer fills in; the tech lead pastes emailed notes here too. */
export function reviewNotesTemplate(lessonId: string, title: string): string {
  return [
    `# Review notes — ${title} (${lessonId})`,
    '',
    'Watch `' + lessonId + '.mp4`. For each change, give the **timestamp**, the **scene id**',
    '(see `script-reference.md`), and a **specific, descriptive edit**. The tech lead pastes',
    'these into git; Claude Code reads them + the script, applies the edits, re-renders, and',
    're-publishes this bundle.',
    '',
    '| Timestamp | Scene id | What to change |',
    '|-----------|----------|----------------|',
    '| 0:00 |  |  |',
    '',
    '## General notes',
    '',
    '',
  ].join('\n');
}
