import { describe, it, expect } from 'vitest';
import { findRelevantContent, formatContentForPrompt } from '@/lib/content-retrieval';
import type { ToolData } from '@/lib/content-types';

function makeTool(overrides: Partial<ToolData> & { id: string; name: string }): ToolData {
  return {
    vendor: 'TestVendor',
    priority: 'P0',
    description: 'A test tool',
    url: 'https://example.com',
    capabilities: {},
    ...overrides,
  };
}

const mockTools: ToolData[] = [
  makeTool({
    id: 'claude',
    name: 'Claude',
    vendor: 'Anthropic',
    description: 'An AI assistant for analysis, coding, and writing tasks',
    url: 'https://claude.ai',
    capabilities: {
      'coding-agent': {
        category: 'coding-agent',
        supported: true,
        summary: 'Autonomous coding with Claude Code CLI',
        subFeatures: [],
        limitations: ['Requires API access'],
        pricingTiers: [],
        versionHistory: [],
      },
      research: {
        category: 'research',
        supported: true,
        summary: 'Deep research and analysis capabilities',
        subFeatures: [],
        limitations: [],
        pricingTiers: [],
        versionHistory: [],
      },
    },
  }),
  makeTool({
    id: 'chatgpt',
    name: 'ChatGPT',
    vendor: 'OpenAI',
    description: 'Conversational AI assistant for general tasks',
    url: 'https://chat.openai.com',
    capabilities: {
      research: {
        category: 'research',
        supported: true,
        summary: 'Web browsing and research',
        subFeatures: [],
        limitations: ['May hallucinate sources'],
        pricingTiers: [],
        versionHistory: [],
      },
      'image-generation': {
        category: 'image-generation',
        supported: true,
        summary: 'DALL-E image generation',
        subFeatures: [],
        limitations: [],
        pricingTiers: [],
        versionHistory: [],
      },
    },
  }),
  makeTool({
    id: 'gemini',
    name: 'Gemini',
    vendor: 'Google',
    description: 'Multimodal AI model for research and creative tasks',
    url: 'https://gemini.google.com',
    capabilities: {
      research: {
        category: 'research',
        supported: true,
        summary: 'Search-grounded research',
        subFeatures: [],
        limitations: [],
        pricingTiers: [],
        versionHistory: [],
      },
      'coding-agent': {
        category: 'coding-agent',
        supported: false,
        summary: 'Not available yet',
        subFeatures: [],
        limitations: [],
        pricingTiers: [],
        versionHistory: [],
      },
    },
  }),
  makeTool({
    id: 'perplexity',
    name: 'Perplexity',
    vendor: 'Perplexity AI',
    description: 'AI-powered search engine for accurate answers',
    url: 'https://perplexity.ai',
    capabilities: {
      research: {
        category: 'research',
        supported: true,
        summary: 'Real-time search with citations',
        subFeatures: [],
        limitations: [],
        pricingTiers: [],
        versionHistory: [],
      },
    },
  }),
];

const loader = () => mockTools;

describe('findRelevantContent', () => {
  it('returns tool matching by name (Claude)', () => {
    const result = findRelevantContent('What can Claude do?', loader);
    expect(result.tools.length).toBeGreaterThanOrEqual(1);
    expect(result.tools.some((t) => t.id === 'claude')).toBe(true);
    expect(result.query).toBe('What can Claude do?');
  });

  it('returns multiple tools when question mentions both', () => {
    const result = findRelevantContent('compare ChatGPT and Gemini', loader);
    expect(result.tools.some((t) => t.id === 'chatgpt')).toBe(true);
    expect(result.tools.some((t) => t.id === 'gemini')).toBe(true);
  });

  it('returns tools matching a capability category (research)', () => {
    const result = findRelevantContent('research tools', loader);
    // All 4 mock tools have research: supported=true except none — all have it
    expect(result.tools.length).toBeGreaterThanOrEqual(3);
    result.tools.forEach((t) => {
      const researchCap = t.capabilities['research'];
      expect(researchCap?.supported).toBe(true);
    });
  });

  it('returns empty array when question has no tool relevance', () => {
    const result = findRelevantContent('hello how are you', loader);
    expect(result.tools).toHaveLength(0);
  });

  it('matches by tool id (case-insensitive)', () => {
    const result = findRelevantContent('tell me about perplexity', loader);
    expect(result.tools.some((t) => t.id === 'perplexity')).toBe(true);
  });

  it('matches by vendor name', () => {
    const result = findRelevantContent('What does Anthropic offer?', loader);
    expect(result.tools.some((t) => t.id === 'claude')).toBe(true);
  });

  it('returns tools with coding-agent capability when asked about coding agents', () => {
    const result = findRelevantContent('what are the best coding agents', loader);
    expect(result.tools.some((t) => t.id === 'claude')).toBe(true);
    // Gemini has coding-agent but supported=false, so it should NOT match via capability
    // (but may still appear due to description word matching)
  });

  it('caps results at top 5 tools', () => {
    const manyTools = Array.from({ length: 10 }, (_, i) =>
      makeTool({
        id: `tool-${i}`,
        name: `Tool${i}`,
        description: 'keyword match here',
      })
    );
    const result = findRelevantContent('keyword', () => manyTools);
    expect(result.tools.length).toBeLessThanOrEqual(5);
  });
});

describe('formatContentForPrompt', () => {
  it('returns empty string for empty array', () => {
    expect(formatContentForPrompt([])).toBe('');
  });

  it('includes tool name and vendor', () => {
    const output = formatContentForPrompt([mockTools[0]]);
    expect(output).toContain('Claude');
    expect(output).toContain('Anthropic');
  });

  it('includes tool description and URL', () => {
    const output = formatContentForPrompt([mockTools[0]]);
    expect(output).toContain('An AI assistant for analysis, coding, and writing tasks');
    expect(output).toContain('https://claude.ai');
  });

  it('includes supported capabilities with summaries', () => {
    const output = formatContentForPrompt([mockTools[0]]);
    expect(output).toContain('coding-agent');
    expect(output).toContain('Autonomous coding with Claude Code CLI');
  });

  it('includes limitations for capabilities', () => {
    const output = formatContentForPrompt([mockTools[0]]);
    expect(output).toContain('Requires API access');
  });

  it('omits unsupported capabilities', () => {
    // Gemini has coding-agent with supported=false
    const output = formatContentForPrompt([mockTools[2]]);
    expect(output).not.toContain('Not available yet');
  });

  it('formats multiple tools', () => {
    const output = formatContentForPrompt([mockTools[0], mockTools[1]]);
    expect(output).toContain('Claude');
    expect(output).toContain('ChatGPT');
  });
});
