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
 * source DOCX and that color is lost in the .txt extraction — so rows are emitted
 * with deliveryType 'unspecified' rather than guessed. (Lesson-level dominant type
 * lives in the curated .planning/curriculum/topic-N/OUTLINE.md.)
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
