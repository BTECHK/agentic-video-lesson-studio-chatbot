import { describe, it, expect } from 'vitest';
import {
  makeEdit,
  openEdits,
  editsForScene,
  setEditStatus,
  applyNarrationEdits,
  type StagedEdit,
} from '@/lib/edits';

const fixed = { id: 'e1', now: '2026-05-24T12:00:00.000Z' };

describe('makeEdit', () => {
  it('stamps metadata and starts open', () => {
    const e = makeEdit({ sceneId: 'intro-hook', field: 'narration', value: 'New words.' }, fixed);
    expect(e).toEqual({
      id: 'e1',
      sceneId: 'intro-hook',
      field: 'narration',
      value: 'New words.',
      author: 'You',
      createdAt: '2026-05-24T12:00:00.000Z',
      status: 'open',
    });
  });
});

const list: StagedEdit[] = [
  { id: '1', sceneId: 'a', field: 'narration', value: 'v1', author: 'You', createdAt: 't1', status: 'open' },
  { id: '2', sceneId: 'a', field: 'narration', value: 'v2', author: 'You', createdAt: 't2', status: 'open' },
  { id: '3', sceneId: 'b', field: 'narration', value: 'vb', author: 'You', createdAt: 't1', status: 'applied' },
];

describe('openEdits / editsForScene / setEditStatus', () => {
  it('filters open edits', () => {
    expect(openEdits(list).map((e) => e.id)).toEqual(['1', '2']);
  });
  it('filters by scene', () => {
    expect(editsForScene(list, 'a').map((e) => e.id)).toEqual(['1', '2']);
  });
  it('updates status immutably', () => {
    const next = setEditStatus(list, '1', 'dismissed');
    expect(next.find((e) => e.id === '1')!.status).toBe('dismissed');
    expect(list.find((e) => e.id === '1')!.status).toBe('open');
  });
});

describe('applyNarrationEdits', () => {
  const blocks = [
    { id: 'a', narration: 'old a' },
    { id: 'b', narration: 'old b' },
    { id: 'c', narration: 'old c' },
  ];

  it('replaces narration for the latest open edit per scene; leaves others untouched', () => {
    const edits: StagedEdit[] = [
      { id: '1', sceneId: 'a', field: 'narration', value: 'first a', author: 'You', createdAt: 't1', status: 'open' },
      { id: '2', sceneId: 'a', field: 'narration', value: 'final a', author: 'You', createdAt: 't2', status: 'open' },
      { id: '3', sceneId: 'b', field: 'narration', value: 'ignored b', author: 'You', createdAt: 't1', status: 'dismissed' },
    ];
    const out = applyNarrationEdits(blocks, edits);
    expect(out.find((b) => b.id === 'a')!.narration).toBe('final a'); // latest open wins
    expect(out.find((b) => b.id === 'b')!.narration).toBe('old b'); // dismissed ignored
    expect(out.find((b) => b.id === 'c')!.narration).toBe('old c'); // untouched
  });

  it('does not mutate the input blocks', () => {
    const edits: StagedEdit[] = [
      { id: '1', sceneId: 'a', field: 'narration', value: 'new a', author: 'You', createdAt: 't', status: 'open' },
    ];
    applyNarrationEdits(blocks, edits);
    expect(blocks.find((b) => b.id === 'a')!.narration).toBe('old a');
  });
});
