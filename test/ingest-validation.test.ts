import { describe, it, expect } from 'vitest';
import { ToolSchema } from '../content/schemas/tool';
import { SourceFileSchema } from '../content/schemas/source';
import { CAPABILITY_CATEGORIES } from '../content/schemas/capabilities';

// --- Helper ---

function makeCapabilityEntry(category: string) {
  return {
    category,
    supported: true,
    summary: `Summary for ${category}`,
    subFeatures: [{ name: 'Feature', description: 'Description' }],
    limitations: ['Limitation'],
    pricingTiers: [{ tier: 'Free', details: 'Basic' }],
    versionHistory: [{ version: '1.0', date: '2024-01', changes: 'Initial' }],
  };
}

function makeScrapedToolData(overrides: Record<string, unknown> = {}) {
  const capabilities: Record<string, unknown> = {};
  for (const cat of CAPABILITY_CATEGORIES) {
    capabilities[cat] = makeCapabilityEntry(cat);
  }
  return {
    id: 'scraped-tool',
    name: 'Scraped Tool',
    vendor: 'ScrapedVendor',
    priority: 'P0',
    description: 'A tool with data from scraping',
    url: 'https://example.com/tool',
    capabilities,
    sourceRefs: ['source-1'],
    ...overrides,
  };
}

// --- Tests ---

describe('Ingestion validation: ToolSchema', () => {
  it('accepts simulated scraped tool data', () => {
    const data = makeScrapedToolData();
    const result = ToolSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects scraped data with missing required fields', () => {
    const data = makeScrapedToolData();
    delete (data as Record<string, unknown>).name;
    delete (data as Record<string, unknown>).vendor;
    const result = ToolSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects scraped data with invalid URL', () => {
    const data = makeScrapedToolData({ url: 'not-a-valid-url' });
    const result = ToolSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts scraped data with stripped HTML text in description', () => {
    // Simulates text that went through sanitizeExtracted — plain text, no HTML
    const data = makeScrapedToolData({
      description: 'ChatGPT is a conversational AI assistant powered by GPT-4o models',
    });
    const result = ToolSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('Ingestion validation: SourceFileSchema', () => {
  it('accepts simulated scraped source entry', () => {
    const data = {
      vendor: 'OpenAI',
      sources: [
        { id: 'openai-changelog', url: 'https://openai.com/changelog', title: 'OpenAI Changelog' },
      ],
    };
    const result = SourceFileSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects source entry with invalid URL', () => {
    const data = {
      vendor: 'OpenAI',
      sources: [
        { id: 'bad-source', url: 'invalid-url', title: 'Bad Source' },
      ],
    };
    const result = SourceFileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects empty sources array', () => {
    const data = { vendor: 'OpenAI', sources: [] };
    const result = SourceFileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
