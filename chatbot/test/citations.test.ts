import { describe, it, expect, vi } from 'vitest';
import { parseCitations, verifyCitations, keepGroundedCitations } from '@/lib/citations';
import type { Citation } from '@/lib/types';

describe('keepGroundedCitations (hallucination guard)', () => {
  const cite = (id: string, tool?: string): Citation => ({
    id,
    module: 'Module 1',
    lesson: 'Lesson 1',
    tool,
    snippet: 'x',
  });

  it('keeps a citation whose tool was retrieved', () => {
    const kept = keepGroundedCitations([cite('c0', 'ChatGPT')], ['ChatGPT', 'Claude']);
    expect(kept).toHaveLength(1);
    expect(kept[0].tool).toBe('ChatGPT');
  });

  it('drops a citation whose tool was NOT retrieved (no fabricated sources)', () => {
    const kept = keepGroundedCitations([cite('c0', 'MockTool')], ['ChatGPT']);
    expect(kept).toHaveLength(0);
  });

  it('keeps a tool-less general citation', () => {
    const kept = keepGroundedCitations([cite('c0')], ['ChatGPT']);
    expect(kept).toHaveLength(1);
  });

  it('filters a mixed set down to only the grounded citations', () => {
    const kept = keepGroundedCitations(
      [cite('c0', 'ChatGPT'), cite('c1', 'Fabricated'), cite('c2')],
      ['ChatGPT'],
    );
    expect(kept.map((c) => c.id)).toEqual(['c0', 'c2']);
  });
});

describe('parseCitations', () => {
  it('extracts a single citation with module and lesson', () => {
    const content = 'Claude is great for code. [Source: Module 1, Lesson 3]';
    const { citations } = parseCitations(content);
    expect(citations).toHaveLength(1);
    expect(citations[0]).toMatchObject({
      id: 'cite-0',
      module: 'Module 1',
      lesson: 'Lesson 3',
      tool: undefined,
    });
  });

  it('extracts a citation with tool name', () => {
    const content = 'Use it for prompts. [Source: Module 2, Lesson 1, Tool: ChatGPT]';
    const { citations } = parseCitations(content);
    expect(citations).toHaveLength(1);
    expect(citations[0].tool).toBe('ChatGPT');
  });

  it('extracts multiple citations', () => {
    const content =
      'First point. [Source: Module 1, Lesson 1] Second point. [Source: Module 3, Lesson 5, Tool: Claude]';
    const { citations } = parseCitations(content);
    expect(citations).toHaveLength(2);
    expect(citations[0].id).toBe('cite-0');
    expect(citations[1].id).toBe('cite-1');
    expect(citations[1].tool).toBe('Claude');
  });

  it('returns empty array when no citations present', () => {
    const content = 'Just a plain response with no citations.';
    const { citations } = parseCitations(content);
    expect(citations).toHaveLength(0);
  });

  it('handles general/bootstrap citations', () => {
    const content = 'Here is info. [Source: General AI knowledge -- course content coming soon]';
    const { citations } = parseCitations(content);
    expect(citations).toHaveLength(1);
    expect(citations[0].module).toBe('General');
    expect(citations[0].lesson).toBe('General');
  });

  it('strips citation markers from cleanContent', () => {
    const content = 'Claude is great. [Source: Module 1, Lesson 2] Use it daily.';
    const { cleanContent } = parseCitations(content);
    expect(cleanContent).not.toContain('[Source:');
    expect(cleanContent).toContain('Claude is great.');
    expect(cleanContent).toContain('Use it daily.');
  });

  it('handles empty string', () => {
    const { cleanContent, citations } = parseCitations('');
    expect(cleanContent).toBe('');
    expect(citations).toHaveLength(0);
  });

  it('preserves snippet from the raw citation text', () => {
    const content = '[Source: Module 5, Lesson 10, Tool: Gemini]';
    const { citations } = parseCitations(content);
    expect(citations[0].snippet).toBe('Module 5, Lesson 10, Tool: Gemini');
  });
});

describe('verifyCitations', () => {
  it('marks citations with matching tool names as verified', () => {
    const citations = [
      { id: 'cite-0', module: 'Module 1', lesson: 'Lesson 1', tool: 'ChatGPT', snippet: 'test' },
    ];
    const result = verifyCitations(citations, ['ChatGPT', 'Claude']);
    expect(result[0].verified).toBe(true);
  });

  it('marks citations with non-matching tool names as unverified', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const citations = [
      { id: 'cite-0', module: 'Module 1', lesson: 'Lesson 1', tool: 'UnknownTool', snippet: 'test' },
    ];
    const result = verifyCitations(citations, ['ChatGPT', 'Claude']);
    expect(result[0].verified).toBe(false);
    warnSpy.mockRestore();
  });

  it('performs case-insensitive matching', () => {
    const citations = [
      { id: 'cite-0', module: 'Module 1', lesson: 'Lesson 1', tool: 'chatgpt', snippet: 'test' },
    ];
    const result = verifyCitations(citations, ['ChatGPT']);
    expect(result[0].verified).toBe(true);
  });

  it('marks citations without a tool field as verified', () => {
    const citations = [
      { id: 'cite-0', module: 'Module 1', lesson: 'Lesson 1', tool: undefined, snippet: 'test' },
    ];
    const result = verifyCitations(citations, ['ChatGPT']);
    expect(result[0].verified).toBe(true);
  });

  it('logs a warning for unverified citations', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const citations = [
      { id: 'cite-0', module: 'Module 1', lesson: 'Lesson 1', tool: 'FakeTool', snippet: 'test' },
    ];
    verifyCitations(citations, ['ChatGPT']);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unverified citation: tool "FakeTool"')
    );
    warnSpy.mockRestore();
  });

  it('handles empty citations array', () => {
    const result = verifyCitations([], ['ChatGPT']);
    expect(result).toHaveLength(0);
  });
});
