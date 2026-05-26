import { describe, it, expect } from 'vitest';
import {
  TEACHABLE_MAX_BYTES,
  validatePublishCandidate,
  buildPublishManifest,
  hashScript,
  buildBundleManifest,
  scriptReferenceMarkdown,
  reviewNotesTemplate,
} from '../src/lib/publish';

describe('validatePublishCandidate', () => {
  it('fails when the source render does not exist', () => {
    const r = validatePublishCandidate({ exists: false, bytes: 0 });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/not found/i);
  });

  it('fails on a zero-byte file', () => {
    const r = validatePublishCandidate({ exists: true, bytes: 0 });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/empty/i);
  });

  it('fails when the file exceeds the Teachable 2GB limit', () => {
    const r = validatePublishCandidate({ exists: true, bytes: TEACHABLE_MAX_BYTES + 1 });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/2 ?GB|exceeds/i);
  });

  it('passes a normal-sized render', () => {
    const r = validatePublishCandidate({ exists: true, bytes: 16_200_000 });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('accepts a file exactly at the limit', () => {
    const r = validatePublishCandidate({ exists: true, bytes: TEACHABLE_MAX_BYTES });
    expect(r.ok).toBe(true);
  });
});

describe('buildPublishManifest', () => {
  it('captures provenance + ready-for-upload status', () => {
    const m = buildPublishManifest({
      lessonId: 'module-1',
      sourcePath: 'out/module-1.mp4',
      bytes: 16_200_000,
      publishedAt: '2026-05-26T00:00:00.000Z',
    });
    expect(m.lessonId).toBe('module-1');
    expect(m.status).toBe('ready-for-upload');
    expect(m.sizeMb).toBeCloseTo(15.45, 1);
    expect(m.target).toBe('teachable');
    expect(m.upload).toMatch(/manual/i);
  });
});

describe('review bundle (#45)', () => {
  it('hashScript is deterministic and content-sensitive', () => {
    const a = hashScript('{"blocks":[{"id":"x","narration":"hi"}]}');
    const b = hashScript('{"blocks":[{"id":"x","narration":"hi"}]}');
    const c = hashScript('{"blocks":[{"id":"x","narration":"changed"}]}');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{12}$/);
  });

  it('buildBundleManifest stamps the script version + review status', () => {
    const m = buildBundleManifest({
      lessonId: 'module-1',
      title: 'Settings Walkthrough',
      videoFile: 'module-1.mp4',
      bytes: 16_200_000,
      publishedAt: '2026-05-26T00:00:00.000Z',
      scriptHash: 'abc123def456',
      blockCount: 9,
    });
    expect(m.status).toBe('ready-for-review');
    expect(m.scriptHash).toBe('abc123def456');
    expect(m.blocks).toBe(9);
    expect(m.video).toBe('module-1.mp4');
    expect(m.review).toMatch(/REVIEW-NOTES/);
    expect(m.teachable).toMatch(/manual upload/i);
  });

  it('scriptReferenceMarkdown lists every block by id', () => {
    const md = scriptReferenceMarkdown('module-1', 'My Lesson', [
      { id: 'intro-hook', narration: 'Welcome.' },
      { id: 'recap', narration: 'That is a wrap.' },
    ]);
    expect(md).toContain('# My Lesson — script reference (module-1)');
    expect(md).toContain('## intro-hook');
    expect(md).toContain('## recap');
    expect(md).toContain('That is a wrap.');
  });

  it('reviewNotesTemplate has the timestamp/scene/change table', () => {
    const md = reviewNotesTemplate('module-1', 'My Lesson');
    expect(md).toContain('# Review notes — My Lesson (module-1)');
    expect(md).toMatch(/Timestamp \| Scene id \| What to change/);
  });
});
