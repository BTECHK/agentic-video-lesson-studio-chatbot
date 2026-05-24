import { describe, it, expect } from 'vitest';
import {
  makeComment,
  commentsForClip,
  pendingCount,
  setStatus,
  type StagedComment,
} from '@/lib/comments';

const fixed = { id: 'c1', now: '2026-05-24T12:00:00.000Z' };

describe('makeComment', () => {
  it('stamps metadata and defaults to open status', () => {
    const c = makeComment(
      { clipId: 'voice-intro-hook', kind: 'voiceover', sceneId: 'intro-hook', body: 'warmer please' },
      fixed,
    );
    expect(c).toEqual({
      id: 'c1',
      clipId: 'voice-intro-hook',
      kind: 'voiceover',
      sceneId: 'intro-hook',
      body: 'warmer please',
      author: 'You',
      createdAt: '2026-05-24T12:00:00.000Z',
      status: 'open',
    });
  });

  it('honors a provided author', () => {
    const c = makeComment({ clipId: 'a', kind: 'script', sceneId: 's', body: 'x', author: 'Instructor' }, fixed);
    expect(c.author).toBe('Instructor');
  });
});

const list: StagedComment[] = [
  { id: '1', clipId: 'voice-a', kind: 'voiceover', sceneId: 'a', body: 'b1', author: 'You', createdAt: 't', status: 'open' },
  { id: '2', clipId: 'voice-a', kind: 'voiceover', sceneId: 'a', body: 'b2', author: 'You', createdAt: 't', status: 'applied' },
  { id: '3', clipId: 'script-b', kind: 'script', sceneId: 'b', body: 'b3', author: 'You', createdAt: 't', status: 'open' },
];

describe('commentsForClip', () => {
  it('filters by clip id', () => {
    expect(commentsForClip(list, 'voice-a').map((c) => c.id)).toEqual(['1', '2']);
    expect(commentsForClip(list, 'script-b').map((c) => c.id)).toEqual(['3']);
  });
});

describe('pendingCount', () => {
  it('counts only open comments', () => {
    expect(pendingCount(list)).toBe(2);
  });
});

describe('setStatus', () => {
  it('updates the targeted comment immutably', () => {
    const next = setStatus(list, '1', 'dismissed');
    expect(next.find((c) => c.id === '1')!.status).toBe('dismissed');
    expect(list.find((c) => c.id === '1')!.status).toBe('open'); // original unchanged
  });
});
