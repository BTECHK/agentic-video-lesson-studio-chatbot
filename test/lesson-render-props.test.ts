import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { renderPropsPath, lessonRenderArgv, writeRenderProps } from '../src/lib/regen-graph';

// Regression: the render leg used to render the LessonVideo composition with its
// hardcoded module-1 defaultProps, so out/<id>.mp4 always got module-1 content
// (caught by Gate C on topic-1-lesson-1). The fix injects the target lesson's props.

describe('renderPropsPath', () => {
  it('points at the lesson’s OWN dir, never module-1', () => {
    const p = renderPropsPath('topic-1-lesson-1', '/repo');
    expect(p).toBe(path.join('/repo', 'content', 'lessons', 'topic-1-lesson-1', '.render-props.json'));
    expect(p).not.toContain('module-1');
  });
});

describe('lessonRenderArgv', () => {
  it('renders LessonVideo to outPath AND injects --props (so defaultProps can’t apply)', () => {
    const argv = lessonRenderArgv('out/topic-1-lesson-1.mp4', '/repo/content/lessons/topic-1-lesson-1/.render-props.json');
    expect(argv).toContain('LessonVideo');
    expect(argv).toContain('out/topic-1-lesson-1.mp4');
    expect(argv.some((a) => a.startsWith('--props='))).toBe(true);
    expect(argv).toContain('--props=/repo/content/lessons/topic-1-lesson-1/.render-props.json');
  });
});

describe('writeRenderProps', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'render-props-'));
    const dir = path.join(root, 'content', 'lessons', 'demo');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'lesson.json'), JSON.stringify({ id: 'demo', scenes: [{ id: 's1' }] }));
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('wraps the lesson under the `lesson` prop key the composition expects', () => {
    const propsPath = writeRenderProps('demo', root);
    const written = JSON.parse(fs.readFileSync(propsPath, 'utf-8'));
    // LessonVideoProps = { lesson }; passing the bare lesson.json would leave props.lesson undefined.
    expect(written).toHaveProperty('lesson');
    expect(written.lesson.id).toBe('demo');
  });
});
