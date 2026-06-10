import { describe, it, expect } from 'vitest';
import { applyDeliveryTypes, parseCourseOutline, resolveRowIds } from '../src/lib/course-map';

const FIXTURE = [
  'Course Overview',
  'Some intro prose that is not a lesson.',
  '',
  'Topic 1: Getting Started with AI Assistants',
  '~27 min of lessons',
  'Learning Outcomes',
  'Configure Something: ...',
  '  ■ Slides/Visual      ■ Demo (in-tool)      ■ Talking Head',
  'Lesson 1.1: How This Course Works (3 min)',
  'Time',
  'Content',
  '1 min',
  'Topic 1 at a Glance The five lessons as a map',
  '1 min',
  'The Topics Ahead A one-screen overview',
  '1 min',
  "Get Ready to Practice A four-item setup checklist",
  'Lesson 1.2: Picking the Right Assistant (8 min)',
  'Time',
  'Content',
  '2 min',
  'Side-by-Side Answers One everyday request',
  '4 min',
  'The Assistants in This Course A short card for each',
].join('\n');

describe('parseCourseOutline', () => {
  it('parses topics → lessons → rows with stable ids and minutes', () => {
    const map = parseCourseOutline(FIXTURE);
    expect(map.topics).toHaveLength(1);
    const t1 = map.topics[0];
    expect(t1.number).toBe(1);
    expect(t1.lessons.map((l) => l.id)).toEqual(['topic-1-lesson-1', 'topic-1-lesson-2']);

    const l11 = t1.lessons[0];
    expect(l11.number).toBe('1.1');
    expect(l11.title).toBe('How This Course Works');
    expect(l11.minutes).toBe(3);
    expect(l11.rows.map((r) => r.id)).toEqual(['T1.1.r1', 'T1.1.r2', 'T1.1.r3']);
    expect(l11.rows.map((r) => r.minutes)).toEqual([1, 1, 1]);
    expect(l11.rows[0].content).toContain('The five lessons');

    const l12 = t1.lessons[1];
    expect(l12.rows.map((r) => r.id)).toEqual(['T1.2.r1', 'T1.2.r2']);
    expect(l12.rows.map((r) => r.minutes)).toEqual([2, 4]);
  });

  it('ignores prose, Learning Outcomes, the legend, and Time/Content headers (no phantom rows)', () => {
    const map = parseCourseOutline(FIXTURE);
    const allRows = map.topics.flatMap((t) => t.lessons.flatMap((l) => l.rows));
    expect(allRows).toHaveLength(5);
    expect(allRows.every((r) => r.minutes !== null)).toBe(true);
  });

  it('marks delivery type unspecified (per-row colors are lost in DOCX→txt extraction)', () => {
    const map = parseCourseOutline(FIXTURE);
    expect(map.topics[0].lessons[0].rows[0].deliveryType).toBe('unspecified');
  });

  it('stamps recovered DOCX delivery types onto course rows in source order', () => {
    const map = parseCourseOutline(FIXTURE);
    const joined = applyDeliveryTypes(map, [
      { contentHead: 'Topic 1 at a Glance', deliveryType: 'slide' },
      { contentHead: 'The Topics Ahead A one-screen', deliveryType: 'slide' },
      { contentHead: 'Skipped DOCX-only row', deliveryType: 'demo' },
      { contentHead: "Get Ready to Practice", deliveryType: 'talking-head' },
      { contentHead: 'Side-by-Side Answers', deliveryType: 'demo' },
      { contentHead: 'The Assistants in This Course', deliveryType: 'slide' },
    ]);

    const rows = joined.map.topics.flatMap((t) => t.lessons.flatMap((l) => l.rows));
    expect(rows.map((r) => r.deliveryType)).toEqual([
      'slide',
      'slide',
      'talking-head',
      'demo',
      'slide',
    ]);
    expect(joined.matched).toBe(5);
    expect(joined.missing).toHaveLength(0);
    expect(joined.unused.map((r) => r.contentHead)).toEqual(['Skipped DOCX-only row']);
  });
});

describe('resolveRowIds', () => {
  it('reports which lesson-plan row ids resolve in the course map and which are missing', () => {
    const map = parseCourseOutline(FIXTURE);
    const res = resolveRowIds(map, ['T1.1.r1', 'T1.1.r2', 'T1.1.r3']);
    expect(res.missing).toHaveLength(0);
    expect(res.resolved).toBe(true);

    const bad = resolveRowIds(map, ['T1.1.r1', 'T1.1.r9']);
    expect(bad.resolved).toBe(false);
    expect(bad.missing).toEqual(['T1.1.r9']);
  });
});
