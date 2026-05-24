import 'server-only';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { makeEdit, setEditStatus, type StagedEdit, type NewEdit, type EditStatus } from './edits';

const LESSONS_DIR = path.join(process.cwd(), '..', 'content', 'lessons');
const fileFor = (lessonId: string) => path.join(LESSONS_DIR, lessonId, '.edits.json');

export function loadEdits(lessonId: string): StagedEdit[] {
  const f = fileFor(lessonId);
  if (!existsSync(f)) return [];
  try {
    return JSON.parse(readFileSync(f, 'utf-8')) as StagedEdit[];
  } catch {
    return [];
  }
}

function write(lessonId: string, list: StagedEdit[]): void {
  const dir = path.join(LESSONS_DIR, lessonId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(fileFor(lessonId), `${JSON.stringify(list, null, 2)}\n`, 'utf-8');
}

export function addStagedEdit(lessonId: string, input: NewEdit): StagedEdit {
  const edit = makeEdit(input, { id: crypto.randomUUID(), now: new Date().toISOString() });
  write(lessonId, [...loadEdits(lessonId), edit]);
  return edit;
}

export function updateEditStatus(lessonId: string, id: string, status: EditStatus): boolean {
  const list = loadEdits(lessonId);
  if (!list.some((e) => e.id === id)) return false;
  write(lessonId, setEditStatus(list, id, status));
  return true;
}

/** Mark every currently-open edit as applied (after they've been written to source). */
export function markOpenEditsApplied(lessonId: string): void {
  write(
    lessonId,
    loadEdits(lessonId).map((e) => (e.status === 'open' ? { ...e, status: 'applied' as const } : e)),
  );
}
