/**
 * Course-map compiler (#68 core). Turns the extracted course outline
 * (.planning/curriculum/source-materials-extracted/course-outline.txt — the
 * committed, diffable form of Instructor's outline DOCX) into a structured, versioned
 * course-map.json: topic → lesson → row, with stable ids the lesson-plan and the
 * gates anchor fidelity against.
 *
 * Lesson id = `topic-<N>-lesson-<M>` (matches content/lessons/<id>/).
 * Row id     = `T<N>.<M>.r<k>` (the lesson-plan's fidelity anchors).
 *
 * NOTE: per-row delivery type (Slide/Demo/Talking-head) is COLOR-CODED in the
 * source DOCX and lost in the .txt extraction. parseCourseOutline emits rows as
 * 'unspecified'; applyDeliveryTypes joins the recovered DOCX row colors back in.
 */

export type DeliveryType = 'slide' | 'demo' | 'talking-head' | 'unspecified';

export interface CourseRow {
  id: string;
  minutes: number | null;
  label: string;
  content: string;
  deliveryType: DeliveryType;
}

export interface CourseLesson {
  id: string;
  number: string; // "1.1"
  title: string;
  minutes: number | null;
  rows: CourseRow[];
}

export interface CourseTopic {
  id: string;
  number: number;
  title: string;
  lessons: CourseLesson[];
}

export interface CourseMap {
  schemaVersion: string;
  source: string;
  topics: CourseTopic[];
}

export type RecoveredDeliveryType = Exclude<DeliveryType, 'unspecified'>;

export interface DeliveryTypeRow {
  contentHead: string;
  deliveryType: RecoveredDeliveryType;
}

export interface DeliveryTypeJoinResult {
  map: CourseMap;
  matched: number;
  missing: CourseRow[];
  unused: DeliveryTypeRow[];
}

const TOPIC_RE = /^Topic (\d+):\s*(.+)$/;
const LESSON_RE = /^Lesson (\d+)\.(\d+):\s*(.+?)(?:\s*\((\d+)\s*min\))?\s*$/;
const DURATION_RE = /^(\d+)\s*min$/;
const SKIP_RE = /^(Time|Content|Learning Outcomes|■|~)/;

/** First ~8 words of the row content as a preview label (the bold header/content
 * boundary is lost in extraction, so this is best-effort; `content` is authoritative). */
function previewLabel(content: string): string {
  const words = content.trim().split(/\s+/).slice(0, 8).join(' ');
  return words.length < content.trim().length ? `${words}…` : words;
}

export function parseCourseOutline(text: string, source = 'course-outline.txt'): CourseMap {
  const lines = text.split(/\r?\n/);
  const topics: CourseTopic[] = [];
  let topic: CourseTopic | null = null;
  let lesson: CourseLesson | null = null;
  let row: CourseRow | null = null;

  const flushRow = () => {
    if (row && lesson) {
      row.content = row.content.trim();
      row.label = previewLabel(row.content);
      lesson.rows.push(row);
    }
    row = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const tm = line.match(TOPIC_RE);
    if (tm) {
      flushRow();
      lesson = null;
      const number = Number(tm[1]);
      topic = { id: `topic-${number}`, number, title: tm[2].trim(), lessons: [] };
      topics.push(topic);
      continue;
    }

    const lm = line.match(LESSON_RE);
    if (lm && topic) {
      flushRow();
      const [, major, minor, title, mins] = lm;
      lesson = {
        id: `topic-${major}-lesson-${minor}`,
        number: `${major}.${minor}`,
        title: title.trim(),
        minutes: mins ? Number(mins) : null,
        rows: [],
      };
      topic.lessons.push(lesson);
      continue;
    }

    const dm = line.match(DURATION_RE);
    if (dm && lesson) {
      flushRow();
      const k = lesson.rows.length + 1;
      row = { id: `${lesson.id.replace(/^topic-(\d+)-lesson-(\d+)$/, 'T$1.$2')}.r${k}`, minutes: Number(dm[1]), label: '', content: '', deliveryType: 'unspecified' };
      continue;
    }

    if (SKIP_RE.test(line)) continue;

    // Otherwise: content for the open row (rows hold their script direction).
    if (row) row.content += (row.content ? ' ' : '') + line;
  }
  flushRow();

  return { schemaVersion: '1.0', source, topics };
}

function cloneCourseMap(map: CourseMap): CourseMap {
  return {
    ...map,
    topics: map.topics.map((topic) => ({
      ...topic,
      lessons: topic.lessons.map((lesson) => ({
        ...lesson,
        rows: lesson.rows.map((row) => ({ ...row })),
      })),
    })),
  };
}

function normalizeDeliveryText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isDeliveryMatch(rowContent: string, contentHead: string): boolean {
  const row = normalizeDeliveryText(rowContent);
  const head = normalizeDeliveryText(contentHead);
  if (!row || !head) return false;
  if (row.startsWith(head) || head.startsWith(row)) return true;

  const prefixLength = Math.min(48, head.length);
  if (prefixLength < 16) return false;
  return row.includes(head.slice(0, prefixLength));
}

function findDeliveryMatch(
  row: CourseRow,
  deliveryRows: DeliveryTypeRow[],
  startIndex: number,
): number {
  const maxLookahead = 12;
  const end = Math.min(deliveryRows.length, startIndex + maxLookahead);
  for (let i = startIndex; i < end; i += 1) {
    if (isDeliveryMatch(row.content, deliveryRows[i].contentHead)) return i;
  }
  return -1;
}

/**
 * Join recovered DOCX row colors onto the parsed text outline. The two sources
 * share source order, but the DOCX can contain rows omitted from the plain-text
 * parse, so the join walks forward and reports skipped delivery rows.
 */
export function applyDeliveryTypes(
  map: CourseMap,
  deliveryRows: DeliveryTypeRow[],
): DeliveryTypeJoinResult {
  const joined = cloneCourseMap(map);
  const missing: CourseRow[] = [];
  const unused: DeliveryTypeRow[] = [];
  let matched = 0;
  let deliveryIndex = 0;

  for (const row of joined.topics.flatMap((topic) => topic.lessons.flatMap((lesson) => lesson.rows))) {
    const matchIndex = findDeliveryMatch(row, deliveryRows, deliveryIndex);
    if (matchIndex === -1) {
      missing.push(row);
      continue;
    }

    unused.push(...deliveryRows.slice(deliveryIndex, matchIndex));
    row.deliveryType = deliveryRows[matchIndex].deliveryType;
    matched += 1;
    deliveryIndex = matchIndex + 1;
  }

  unused.push(...deliveryRows.slice(deliveryIndex));
  return { map: joined, matched, missing, unused };
}

export interface ResolveResult {
  resolved: boolean;
  missing: string[];
}

/** Check that lesson-plan row ids exist in the course map (Gate A fidelity anchor). */
export function resolveRowIds(map: CourseMap, rowIds: string[]): ResolveResult {
  const known = new Set(map.topics.flatMap((t) => t.lessons.flatMap((l) => l.rows.map((r) => r.id))));
  const missing = rowIds.filter((id) => !known.has(id));
  return { resolved: missing.length === 0, missing };
}
