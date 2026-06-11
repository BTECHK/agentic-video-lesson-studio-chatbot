import { describe, it, expect } from 'vitest';
import { respond } from '../src/brain.js';
import { findRelevantTools } from '../src/retrieval.js';
import type { ChatTurn, LLMProvider, ToolData } from '../src/types.js';

const TOOLS: ToolData[] = [
  {
    id: 'claude',
    name: 'Claude',
    vendor: 'Anthropic',
    description: 'A capable assistant for writing and research and analysis tasks.',
    url: 'https://claude.ai',
    capabilities: { research: { supported: true, summary: 'deep research' } },
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    vendor: 'OpenAI',
    description: 'A popular assistant for writing and coding and everyday questions.',
    url: 'https://chatgpt.com',
    capabilities: { writing: { supported: true, summary: 'general writing' } },
  },
];

// A provider that emits whatever text we hand it — lets us simulate a model that
// cites a NON-retrieved tool (the hallucination the guard must drop).
class ScriptedProvider implements LLMProvider {
  readonly name = 'scripted';
  constructor(private out: string) {}
  async complete(): Promise<string> {
    return this.out;
  }
}

const deps = (out: string) => ({ provider: new ScriptedProvider(out), tools: TOOLS });

describe('retrieval', () => {
  it('returns the tool named in the message, ranked first', () => {
    const r = findRelevantTools('how does claude do research', TOOLS);
    expect(r[0].name).toBe('Claude');
  });
  it('returns nothing for an unrelated message', () => {
    expect(findRelevantTools('what time is the bus to Downtown', TOOLS)).toHaveLength(0);
  });
});

describe('respond — grounding + the Tutor invariant (no fabricated sources)', () => {
  it('lists a Source for a retrieved tool the answer names', async () => {
    const history: ChatTurn[] = [{ role: 'user', content: 'tell me about Claude for research' }];
    const reply = await respond(history, true, deps('Claude is great for research.'));
    expect(reply.citations).toHaveLength(1);
    expect(reply.citations[0].tool).toBe('Claude');
  });

  it('strips stray source/tool markup from the display text', async () => {
    const history: ChatTurn[] = [{ role: 'user', content: 'tell me about Claude' }];
    const reply = await respond(
      history,
      true,
      deps('Claude is great (Tool: Anthropic). [Source: Module 1, Lesson 2, Tool: Claude]'),
    );
    expect(reply.text).not.toContain('[Source:');
    expect(reply.text).not.toContain('(Tool:');
    expect(reply.text).toBe('Claude is great.');
  });

  it('never shows a source the model named but retrieval did not surface', async () => {
    // User asks about Claude (only Claude/ChatGPT exist); model name-drops Gemini.
    const history: ChatTurn[] = [{ role: 'user', content: 'tell me about Claude' }];
    const reply = await respond(history, true, deps('Our pick is Gemini for that.'));
    expect(reply.citations.find((c) => c.tool === 'Gemini')).toBeUndefined();
    expect(reply.citations).toHaveLength(0);
  });

  it('adds no Sources for a general answer that names no tool', async () => {
    const history: ChatTurn[] = [{ role: 'user', content: 'what is this course about' }];
    const reply = await respond(history, true, deps('A practical AI course.'));
    expect(reply.citations).toHaveLength(0);
  });
});
