import { describe, it, expect } from 'vitest';
import {
  resolveCurriculumDir,
  lessonDriveTarget,
  pickFolder,
  folderExists,
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
    {
      id: 'bonus',
      number: 5,
      title: 'Bonus Topic: Sample Extras',
      lessons: [
        { id: 'bonus-intro', number: 'B.0', title: 'Bonus Intro — Sample Extras Overview', minutes: 3, rows: [] },
        { id: 'bonus-1', number: 'B.1', title: 'Sample Extra One', minutes: 9, rows: [] },
        { id: 'bonus-2', number: 'B.2', title: 'Sample Extra Two', minutes: 9, rows: [] },
        {
          id: 'bonus-3',
          number: 'B.3',
          title: 'Sample Extra Three — Full Title',
          minutes: 9,
          rows: [],
        },
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

  // The bonus topic ships under a human-created "Bonus — Sample Extras" folder on
  // Drive, not the generic "Module 5 — ..." every other topic gets — see
  // artifacts/verification/goal-2026-08-01/drive-fix/ROOT-CAUSE-bonus-hang.md.
  it('special-cases the bonus topic to the real Drive folder-naming convention', () => {
    const t = lessonDriveTarget(MAP, 'bonus-intro')!;
    expect(t.modulePrefix).toBe('Bonus');
    expect(t.moduleFolder).toBe('Bonus — Sample Extras');
    expect(t.lessonPrefix).toBe('Bonus Intro');
    expect(t.lessonFolder).toBe('Bonus Intro — Sample Extras Overview');
  });
  it('maps bonus-1/2/3 to "Bonus N — <title>" lesson folders', () => {
    expect(lessonDriveTarget(MAP, 'bonus-1')!.lessonPrefix).toBe('Bonus 1');
    expect(lessonDriveTarget(MAP, 'bonus-1')!.lessonFolder).toBe('Bonus 1 — Sample Extra One');
    expect(lessonDriveTarget(MAP, 'bonus-2')!.lessonPrefix).toBe('Bonus 2');
    expect(lessonDriveTarget(MAP, 'bonus-2')!.lessonFolder).toBe('Bonus 2 — Sample Extra Two');
    expect(lessonDriveTarget(MAP, 'bonus-3')!.lessonPrefix).toBe('Bonus 3');
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
  it('matches the real bonus module + lesson folders on Drive', () => {
    const modules = ['Module 2 — Sample Module', 'Bonus — Sample Extras'];
    expect(pickFolder(modules, 'Bonus', 'Bonus — Sample Extras')).toBe('Bonus — Sample Extras');
    const bonusLessons = [
      'Bonus Intro — Sample Extras Overview',
      'Bonus 1 — Sample Extra One',
      'Bonus 2 — Sample Extra Two',
      'Bonus 3 — Sample Extra Three',
    ];
    expect(pickFolder(bonusLessons, 'Bonus 3', 'Bonus 3 — Sample Extra Three — Full Title')).toBe(
      'Bonus 3 — Sample Extra Three',
    );
  });
});

describe('folderExists', () => {
  // Guards the mkdir-hang bug: pickFolder silently falls back to a canonical name
  // that doesn't exist yet, and the caller must NOT mkdirSync a new top-level tree
  // on that fallback — see ROOT-CAUSE-bonus-hang.md.
  it('is true when a folder already matches the prefix', () => {
    expect(folderExists(['Module 2 — Sample Module', 'Bonus — Sample Extras'], 'Bonus')).toBe(true);
  });
  it('is false when nothing matches — caller must error out, not mkdirSync', () => {
    expect(folderExists(['Module 2 — Sample Module'], 'Module 5')).toBe(false);
  });
});
