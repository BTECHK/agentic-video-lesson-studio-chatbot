import { describe, it, expect } from 'vitest';
import { getLessonClassification } from '@/lib/lesson-classification';

describe('getLessonClassification', () => {
  it('marks module-1 as a sample walkthrough lesson', () => {
    const info = getLessonClassification('module-1');
    expect(info.classification).toBe('sample');
    expect(info.badge).toBe('Sample lesson');
    expect(info.note).toContain('Not part of the sample curriculum');
  });

  it('defaults unknown lessons to curriculum', () => {
    const info = getLessonClassification('topic-1-lesson-1');
    expect(info.classification).toBe('curriculum');
    expect(info.badge).toBe('Curriculum lesson');
    expect(info.note).toBeUndefined();
  });
});
