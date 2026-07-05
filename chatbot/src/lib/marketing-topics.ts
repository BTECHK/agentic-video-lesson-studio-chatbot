import 'server-only';
import fs from 'fs';
import path from 'path';

const COURSE_MAP_PATH = path.join(process.cwd(), '..', 'content', 'curriculum', 'course-map.json');

export interface MarketingTopic {
  number: string;
  title: string;
}

interface CourseMapLesson {
  number: string;
  title: string;
}

interface CourseMapTopic {
  number: number;
  lessons: CourseMapLesson[];
}

interface CourseMap {
  topics: CourseMapTopic[];
}

/** First `limit` lesson titles of Topic 1, for the marketing page's module preview. */
export function getMarketingTopics(limit = 5): MarketingTopic[] {
  const raw = fs.readFileSync(COURSE_MAP_PATH, 'utf-8');
  const courseMap = JSON.parse(raw) as CourseMap;
  const topic1 = courseMap.topics.find((t) => t.number === 1);
  if (!topic1) return [];

  return topic1.lessons.slice(0, limit).map((lesson, i) => ({
    number: String(i + 1).padStart(2, '0'),
    title: lesson.title,
  }));
}
