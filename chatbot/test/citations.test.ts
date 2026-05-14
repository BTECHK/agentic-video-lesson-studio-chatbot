import { describe, it, expect } from 'vitest';
import { parseCitations } from '@/lib/citations';

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
