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
