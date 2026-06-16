import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildEditPrompt, aiEditScript } from '../src/lib/ai-regen';

describe('buildEditPrompt', () => {
  it('embeds the reviewer comment, the target scene, and the current script', () => {
    const prompt = buildEditPrompt({
      lessonId: 'module-1',
      sceneId: 'cover',
      comment: 'Tighten the intro and cut the jargon.',
      scriptJson: '{"blocks":[{"id":"cover","narration":"Hello there."}]}',
    });
    expect(prompt).toContain('Tighten the intro and cut the jargon.');
    expect(prompt).toContain('module-1');
    expect(prompt).toContain('cover');
    expect(prompt).toContain('Hello there.');
    expect(prompt.toLowerCase()).toContain('json');
  });

  it('targets the whole lesson script when no sceneId is given', () => {
    const prompt = buildEditPrompt({ lessonId: 'm', comment: 'Make it punchier.', scriptJson: '{"blocks":[]}' });
    expect(prompt.toLowerCase()).toContain('lesson script');
  });
});

describe('aiEditScript', () => {
  let root: string;
  const scriptPath = () => join(root, 'content', 'lessons', 'm1', 'script.json');

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'aiedit-'));
    mkdirSync(join(root, 'content', 'lessons', 'm1'), { recursive: true });
    writeFileSync(scriptPath(), JSON.stringify({ id: 'm1', blocks: [{ id: 'cover', narration: 'old' }] }));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('rewrites script.json with the AI-edited blocks, preserving other top-level fields', async () => {
    const edited = await aiEditScript(
      'm1',
      { sceneId: 'cover', comment: 'new intro' },
      { root, generate: async () => ({ blocks: [{ id: 'cover', narration: 'new' }] }) },
    );
    expect(edited.blocks[0].narration).toBe('new');
    const written = JSON.parse(readFileSync(scriptPath(), 'utf-8'));
    expect(written.id).toBe('m1'); // top-level field preserved
    expect(written.blocks[0].narration).toBe('new'); // block edited
  });

  it('throws and leaves script.json untouched when the AI returns no blocks', async () => {
    await expect(
      aiEditScript('m1', { comment: 'x' }, { root, generate: async () => ({ nope: true }) }),
    ).rejects.toThrow();
    const written = JSON.parse(readFileSync(scriptPath(), 'utf-8'));
    expect(written.blocks[0].narration).toBe('old'); // unchanged
  });
});
