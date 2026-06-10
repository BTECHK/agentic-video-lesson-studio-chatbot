import { describe, it, expect } from 'vitest';
import {
  resolveCurriculumDir,
  lessonDriveTarget,
  pickFolder,
} from '../src/lib/drive-publish';
import type { CourseMap } from '../src/lib/course-map';

const MAP: CourseMap = {
  schemaVersion: '1.0',
  source: 'test',
  topics: [
    {
      id: 'topic-1',
      number: 1,
      title: 'Getting Started with AI Assistants',
      lessons: [
        { id: 'topic-1-lesson-3', number: '1.3', title: 'Writing Clear Prompts', minutes: 8, rows: [] },
      ],
    },
  ],
};

describe('resolveCurriculumDir', () => {
  it('prefers the env var', () => {
    const r = resolveCurriculumDir({ env: 'G:\\Drive\\Curriculum', configFile: { curriculumDir: '/other' } });
    expect(r.ok).toBe(true);
    expect(r.dir).toBe('G:\\Drive\\Curriculum');
  });
  it('falls back to the per-machine config file', () => {
    const r = resolveCurriculumDir({ env: undefined, configFile: { curriculumDir: '/Users/dev/.../Curriculum' } });
    expect(r.ok).toBe(true);
    expect(r.dir).toBe('/Users/dev/.../Curriculum');
  });
  it('errors with setup guidance when nothing is configured', () => {
    const r = resolveCurriculumDir({ env: '   ', configFile: null });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/DRIVE_CURRICULUM_DIR/);
    expect(r.error).toMatch(/drive\.local\.json/);
    expect(r.error).toMatch(/macOS/);
  });
});

describe('lessonDriveTarget', () => {
  it('maps a lessonId to exec Module/Lesson folders + named artifacts', () => {
    const t = lessonDriveTarget(MAP, 'topic-1-lesson-3')!;
    expect(t.moduleNumber).toBe(1);
    expect(t.lessonNumber).toBe('1.3');
    expect(t.moduleFolder).toBe('Module 1 — Getting Started with AI Assistants');
    expect(t.lessonFolder).toBe('Lesson 1.3 — Writing Clear Prompts');
    expect(t.artifacts.video).toBe('1.3 Video.mp4');
    expect(t.artifacts.script).toBe('1.3 Script');
    expect(t.artifacts.plan).toBe('1.3 Lesson Plan');
  });
  it('returns null for an unknown lesson', () => {
    expect(lessonDriveTarget(MAP, 'topic-9-lesson-9')).toBeNull();
  });
});

describe('pickFolder', () => {
  it('matches an existing folder by prefix despite title punctuation drift', () => {
    const existing = ['00 — START HERE', 'Module 1 — Getting Started with AI Assistants'];
    expect(pickFolder(existing, 'Module 1', 'Module 1 — canonical')).toBe(
      'Module 1 — Getting Started with AI Assistants',
    );
  });
  it('falls back to canonical when nothing matches', () => {
    expect(pickFolder(['Module 2 — x'], 'Lesson 1.3', 'Lesson 1.3 — Writing Clear Prompts')).toBe(
      'Lesson 1.3 — Writing Clear Prompts',
    );
  });
});
