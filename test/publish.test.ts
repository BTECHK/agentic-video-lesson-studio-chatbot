import { describe, it, expect } from 'vitest';
import {
  TEACHABLE_MAX_BYTES,
  validatePublishCandidate,
  buildPublishManifest,
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
