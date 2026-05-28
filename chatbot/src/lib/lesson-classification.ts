export type LessonClassification = 'sample' | 'curriculum';

export interface LessonClassificationInfo {
  classification: LessonClassification;
  badge: string;
  note?: string;
}

const DEFAULT_CLASSIFICATION: LessonClassificationInfo = {
  classification: 'curriculum',
  badge: 'Curriculum lesson',
};

const LESSON_CLASSIFICATIONS: Record<string, LessonClassificationInfo> = {
  'module-1': {
    classification: 'sample',
    badge: 'Sample lesson',
    note: 'Website walkthrough demo only. Not part of the sample curriculum.',
  },
};

export function getLessonClassification(lessonId: string): LessonClassificationInfo {
  return LESSON_CLASSIFICATIONS[lessonId] ?? DEFAULT_CLASSIFICATION;
}
