import { describe, it, expect } from 'vitest';
import { buildRegenArgs, RegenTriggerSchema } from '@/lib/regen-trigger';

describe('buildRegenArgs', () => {
  it('builds a lesson regenerate command', () => {
    expect(buildRegenArgs({ lessonId: 'module-1' })).toEqual(['module-1']);
  });

  it('rejects a lessonId with path/shell characters', () => {
    expect(() => buildRegenArgs({ lessonId: '../etc/passwd' })).toThrow();
    expect(() => buildRegenArgs({ lessonId: 'a; rm -rf /' })).toThrow();
  });

  it('threads sceneId and comment through so the AI-edit step receives them (#18)', () => {
    expect(buildRegenArgs({ lessonId: 'module-1', sceneId: 'cover', comment: 'tighten the intro' })).toEqual([
      'module-1',
      '--scene',
      'cover',
      '--comment',
      'tighten the intro',
    ]);
  });

  it('rejects a sceneId with path/shell characters', () => {
    expect(() => buildRegenArgs({ lessonId: 'module-1', sceneId: '../x' })).toThrow();
  });
});

describe('RegenTriggerSchema', () => {
  it('accepts a valid trigger with optional scene + comment', () => {
    const r = RegenTriggerSchema.safeParse({ lessonId: 'module-1', sceneId: 'cover', comment: 'tighten intro' });
    expect(r.success).toBe(true);
  });

  it('requires a lessonId', () => {
    expect(RegenTriggerSchema.safeParse({ sceneId: 'cover' }).success).toBe(false);
  });
});
