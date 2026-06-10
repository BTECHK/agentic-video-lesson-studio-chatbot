/**
 * Compile the extracted course outline into a versioned, diffable course-map.json
 * (#68 core). The outline is the single source of truth for structure; this makes
 * it machine-readable so the lesson-plan + gates can anchor fidelity to row ids.
 *
 *   npm run compile:course-map            compile + write content/curriculum/course-map.json
 *   npm run compile:course-map -- --check  also verify known lesson-plan row ids resolve
 *
 * Input: .planning/curriculum/source-materials-extracted/course-outline.txt
 *   (the committed extraction of sample-course-outline.docx; the
 *    DOCX→txt step is manual/upstream.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { runMain } from '../src/lib/logger';
import {
  applyDeliveryTypes,
  parseCourseOutline,
  resolveRowIds,
  type CourseMap,
  type CourseRow,
  type DeliveryTypeRow,
} from '../src/lib/course-map';

const OUTLINE = path.join('.planning', 'curriculum', 'source-materials-extracted', 'course-outline.txt');
const DELIVERY_TYPES = path.join('content', 'curriculum', 'delivery-types.json');
const OUT = path.join('content', 'curriculum', 'course-map.json');

interface DeliveryTypesFile {
  rows: DeliveryTypeRow[];
}

function allRows(map: CourseMap): CourseRow[] {
  return map.topics.flatMap((topic) => topic.lessons.flatMap((lesson) => lesson.rows));
}

function rowSummary(row: CourseRow): string {
  return `${row.id} ${row.content.slice(0, 60)}`;
}

runMain('compile:course-map', async (log) => {
  if (!fs.existsSync(OUTLINE)) {
    log.error(`outline not found: ${OUTLINE}`);
    return 1;
  }
  const baseMap = parseCourseOutline(fs.readFileSync(OUTLINE, 'utf-8'), path.basename(OUTLINE));
  let map = baseMap;

  if (fs.existsSync(DELIVERY_TYPES)) {
    const deliveryTypes = JSON.parse(fs.readFileSync(DELIVERY_TYPES, 'utf-8')) as DeliveryTypesFile;
    const joined = applyDeliveryTypes(baseMap, deliveryTypes.rows);
    if (joined.missing.length > 0) {
      log.error('delivery-type join FAILED - course rows could not be matched', {
        missing: joined.missing.map(rowSummary),
      });
      return 1;
    }
    map = joined.map;
    log.info('joined delivery types', {
      matched: joined.matched,
      unusedDeliveryRows: joined.unused.length,
      unusedHeads: joined.unused.slice(0, 8).map((row) => row.contentHead),
    });
  } else {
    log.warn('delivery-types file not found; rows remain unspecified', { deliveryTypes: DELIVERY_TYPES });
  }

  const lessons = map.topics.reduce((n, t) => n + t.lessons.length, 0);
  const rows = map.topics.reduce((n, t) => n + t.lessons.reduce((m, l) => m + l.rows.length, 0), 0);
  log.info('compiled course map', { topics: map.topics.length, lessons, rows });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(map, null, 2)}\n`);
  log.info('wrote course map', { out: OUT });

  if (process.argv.includes('--check')) {
    // Fidelity self-check: the authored topic-1-lesson-1 plan anchors on these rows.
    const ids = ['T1.1.r1', 'T1.1.r2', 'T1.1.r3'];
    const res = resolveRowIds(map, ids);
    const unspecified = allRows(map).filter((row) => row.deliveryType === 'unspecified');
    if (unspecified.length > 0) {
      log.error('delivery-type check FAILED - rows remain unspecified', {
        unspecified: unspecified.map(rowSummary),
      });
      return 1;
    }
    log.info('delivery-type check passed', { typedRows: rows });
    if (res.resolved) {
      log.info('row-id check passed', { ids });
    } else {
      log.error('row-id check FAILED — plan row ids missing from course map', { missing: res.missing });
      return 1;
    }
  }
  return 0;
});
