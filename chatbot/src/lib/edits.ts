/**
 * Staged content edits for the Studio. An edit is a concrete change to a scene
 * field (currently narration text) that stages as pending, then on Apply mutates
 * the upstream source (script.json) and regenerates only what changed. Pure
 * helpers here; the file-backed store is in edits-store.ts.
 */

export type EditField = 'narration';
export type EditStatus = 'open' | 'applied' | 'dismissed';

export interface StagedEdit {
  id: string;
  sceneId: string;
  field: EditField;
  value: string;
  author: string;
  createdAt: string;
  status: EditStatus;
}

export interface NewEdit {
  sceneId: string;
  field: EditField;
  value: string;
  author?: string;
}

export function makeEdit(input: NewEdit, opts: { id: string; now: string }): StagedEdit {
  return {
    id: opts.id,
    sceneId: input.sceneId,
    field: input.field,
    value: input.value,
    author: input.author ?? 'You',
    createdAt: opts.now,
    status: 'open',
  };
}

export const openEdits = (list: StagedEdit[]): StagedEdit[] => list.filter((e) => e.status === 'open');

export const editsForScene = (list: StagedEdit[], sceneId: string): StagedEdit[] =>
  list.filter((e) => e.sceneId === sceneId);

export const setEditStatus = (list: StagedEdit[], id: string, status: EditStatus): StagedEdit[] =>
  list.map((e) => (e.id === id ? { ...e, status } : e));

interface NarratedBlock {
  id: string;
  narration: string;
  [key: string]: unknown;
}

/**
 * Apply open narration edits to script blocks (the source of truth). The latest
 * open edit per scene wins; blocks without an edit are untouched. Pure — returns
 * new blocks, does not mutate the input.
 */
export function applyNarrationEdits<T extends NarratedBlock>(blocks: T[], edits: StagedEdit[]): T[] {
  const latest = new Map<string, string>();
  for (const e of edits) {
    if (e.status === 'open' && e.field === 'narration') latest.set(e.sceneId, e.value);
  }
  return blocks.map((b) => (latest.has(b.id) ? { ...b, narration: latest.get(b.id)! } : b));
}
