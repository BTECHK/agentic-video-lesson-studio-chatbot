import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { ScriptSchema, parseContentRef } from '../content/schemas/script';
import { OutlineSchema } from '../content/schemas/outline';
import { buildGroundingContext } from '../src/lib/grounding';
import { factCheckScript } from '../src/lib/fact-check';

const TOOLS_DIR = path.join(__dirname, '..', 'content', 'tools');

function makeOutline(overrides: Record<string, unknown> = {}) {
  return OutlineSchema.parse({
    schemaVersion: '1.0',
    id: 'l1',
    lesson: { title: 'T', topic: 'X', module: 'M1' },
    sections: [
      {
        id: 'sec1', title: 'S', objective: 'O',
        beats: [
          { id: 'b1', summary: 'tools', toolRefs: ['claude', 'gemini'], capabilityRefs: ['writing-chat', 'dictation'] },
        ],
      },
    ],
    meta: { createdAt: '2026-05-23', lastUpdated: '2026-05-23', authors: ['K'] },
    ...overrides,
  });
}

function makeScript(blocks: unknown[]) {
  return ScriptSchema.parse({
    schemaVersion: '1.0',
    lessonId: 'l1',
    blocks,
    meta: { generatedAt: '2026-05-23' },
  });
}

describe('parseContentRef', () => {
  it('parses a tool ref', () => {
    expect(parseContentRef('tool:claude')).toEqual({ kind: 'tool', toolId: 'claude' });
  });
  it('parses a cap ref', () => {
    expect(parseContentRef('cap:claude:agents')).toEqual({ kind: 'cap', toolId: 'claude', category: 'agents' });
  });
  it('flags malformed refs', () => {
    expect(parseContentRef('claude').kind).toBe('invalid');
    expect(parseContentRef('tool:Claude').kind).toBe('invalid'); // uppercase not allowed
  });
});

describe('ScriptSchema', () => {
  it('accepts a valid script block', () => {
    const s = makeScript([
      { id: 'blk1', sectionId: 'sec1', beatId: 'b1', sceneType: 'tool-card-reveal', narration: 'Meet the tools.', contentRefs: ['tool:claude'] },
    ]);
    expect(s.blocks).toHaveLength(1);
  });
  it('rejects empty narration', () => {
    const r = ScriptSchema.safeParse({
      schemaVersion: '1.0', lessonId: 'l1',
      blocks: [{ id: 'b', sectionId: 's', beatId: 'b1', sceneType: 'cover', narration: '' }],
      meta: { generatedAt: '2026-05-23' },
    });
    expect(r.success).toBe(false);
  });
  it('rejects an invalid sceneType', () => {
    const r = ScriptSchema.safeParse({
      schemaVersion: '1.0', lessonId: 'l1',
      blocks: [{ id: 'b', sectionId: 's', beatId: 'b1', sceneType: 'nope', narration: 'x' }],
      meta: { generatedAt: '2026-05-23' },
    });
    expect(r.success).toBe(false);
  });
});

describe('buildGroundingContext', () => {
  it('loads referenced tools and capabilities from real content', () => {
    const g = buildGroundingContext(makeOutline(), TOOLS_DIR);
    expect(g.tools.claude?.name).toBe('Claude');
    expect(g.tools.gemini?.name).toBeTruthy();
    expect(g.capabilities['claude:writing-chat']?.supported).toBe(true);
  });
  it('captures unsupported capabilities with their supported flag', () => {
    const g = buildGroundingContext(makeOutline(), TOOLS_DIR);
    // Claude has no native dictation in the codified facts
    expect(g.capabilities['claude:dictation']?.supported).toBe(false);
  });
});

describe('factCheckScript', () => {
  const grounding = buildGroundingContext(makeOutline(), TOOLS_DIR);

  it('passes when every ref resolves', () => {
    const script = makeScript([
      { id: 'b1', sectionId: 'sec1', beatId: 'b1', sceneType: 'tool-card-reveal', narration: 'Claude is a strong writer.', contentRefs: ['tool:claude', 'cap:claude:writing-chat'] },
    ]);
    const r = factCheckScript(script, grounding);
    expect(r.ok).toBe(true);
    expect(r.verifiedRefs).toBe(2);
    expect(r.flags).toHaveLength(0);
  });

  it('flags an unknown tool ref (blocks pipeline)', () => {
    const script = makeScript([
      { id: 'b1', sectionId: 'sec1', beatId: 'b1', sceneType: 'cover', narration: 'x', contentRefs: ['tool:copilot'] },
    ]);
    const r = factCheckScript(script, grounding);
    expect(r.ok).toBe(false);
    expect(r.flags[0].ref).toBe('tool:copilot');
  });

  it('flags a capability not in the grounding context', () => {
    const script = makeScript([
      { id: 'b1', sectionId: 'sec1', beatId: 'b1', sceneType: 'cover', narration: 'x', contentRefs: ['cap:claude:image-generation'] },
    ]);
    const r = factCheckScript(script, grounding); // outline only grounded writing-chat + dictation
    expect(r.ok).toBe(false);
  });

  it('notes (does not flag) a reference to an unsupported capability', () => {
    const script = makeScript([
      { id: 'b1', sectionId: 'sec1', beatId: 'b1', sceneType: 'feature-grid', narration: 'Claude has no built-in dictation.', contentRefs: ['cap:claude:dictation'] },
    ]);
    const r = factCheckScript(script, grounding);
    expect(r.ok).toBe(true);
    expect(r.notes).toHaveLength(1);
    expect(r.notes[0].ref).toBe('cap:claude:dictation');
  });

  it('flags malformed refs', () => {
    const script = makeScript([
      { id: 'b1', sectionId: 'sec1', beatId: 'b1', sceneType: 'cover', narration: 'x', contentRefs: ['claude'] },
    ]);
    expect(factCheckScript(script, grounding).ok).toBe(false);
  });
});
