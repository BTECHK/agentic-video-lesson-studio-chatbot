import { describe, it, expect } from 'vitest';
import {
  CapabilityCategorySchema,
  CAPABILITY_CATEGORIES,
  ToolSchema,
  CapabilityEntrySchema,
  SourceFileSchema,
  SourceEntrySchema,
  SceneTypeSchema,
  SCENE_TYPES,
  CoverContentSchema,
  CapabilityTableContentSchema,
  QuoteCardContentSchema,
  LessonSchema,
} from '../content/schemas';

// --- Helper factories ---

function makeCapabilityEntry(overrides: Record<string, unknown> = {}) {
  return {
    category: 'writing-chat',
    supported: true,
    summary: 'General writing and chat',
    subFeatures: [{ name: 'Chat', description: 'Conversational AI' }],
    limitations: ['Context window limited'],
    pricingTiers: [{ tier: 'Free', details: 'Basic access' }],
    versionHistory: [{ version: '1.0', date: '2024-01', changes: 'Initial' }],
    ...overrides,
  };
}

function makeMinimalTool(overrides: Record<string, unknown> = {}) {
  const capabilities: Record<string, unknown> = {};
  for (const cat of CAPABILITY_CATEGORIES) {
    capabilities[cat] = makeCapabilityEntry({ category: cat });
  }
  return {
    id: 'test-tool',
    name: 'Test Tool',
    vendor: 'TestVendor',
    priority: 'P0',
    description: 'A test tool',
    url: 'https://example.com',
    capabilities,
    sourceRefs: ['test-source-1'],
    ...overrides,
  };
}

function makeValidLesson(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0',
    id: 'test-lesson',
    lesson: { title: 'Test', topic: 'T1', module: 'M1', duration: 15 },
    scenes: [
      { id: 's1', type: 'cover', start: 0, duration: 8, content: { eyebrow: 'E', title: ['T'], sub: 'S' } },
      { id: 's2', type: 'recap-grid', start: 8, duration: 7, content: { eyebrow: 'E', title: 'T', cards: [] } },
    ],
    meta: { createdAt: '2026-01-01', lastUpdated: '2026-01-01', authors: ['Test'], factCheckedAt: null },
    ...overrides,
  };
}

// --- Tests ---

describe('CapabilityCategory', () => {
  it('accepts all 11 valid categories', () => {
    const categories = [
      'writing-chat', 'research', 'file-analysis', 'document-creation',
      'image-generation', 'prototyping', 'personalization',
      'persistent-context', 'agents', 'connectors', 'dictation',
    ];
    for (const cat of categories) {
      expect(CapabilityCategorySchema.safeParse(cat).success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    expect(CapabilityCategorySchema.safeParse('invalid-category').success).toBe(false);
  });

  it('has exactly 11 entries', () => {
    expect(CAPABILITY_CATEGORIES).toHaveLength(11);
  });
});

describe('ToolSchema', () => {
  it('accepts a valid tool with all 11 capability categories', () => {
    const result = ToolSchema.safeParse(makeMinimalTool());
    expect(result.success).toBe(true);
  });

  it('rejects a tool with missing id', () => {
    const tool = makeMinimalTool();
    delete (tool as Record<string, unknown>).id;
    expect(ToolSchema.safeParse(tool).success).toBe(false);
  });

  it('rejects a tool with invalid priority', () => {
    expect(ToolSchema.safeParse(makeMinimalTool({ priority: 'P2' })).success).toBe(false);
  });

  it('rejects a tool with invalid URL', () => {
    expect(ToolSchema.safeParse(makeMinimalTool({ url: 'not-a-url' })).success).toBe(false);
  });
});

describe('CapabilityEntrySchema', () => {
  it('requires subFeatures with min 1 entry', () => {
    const entry = makeCapabilityEntry({ subFeatures: [] });
    expect(CapabilityEntrySchema.safeParse(entry).success).toBe(false);
  });

  it('accepts full entry with all fields', () => {
    const entry = makeCapabilityEntry({
      subFeatures: [
        { name: 'Feature A', description: 'Desc A', availableOn: ['Pro'] },
        { name: 'Feature B', description: 'Desc B' },
      ],
      limitations: ['Limit 1', 'Limit 2'],
      pricingTiers: [
        { tier: 'Free', details: 'Basic' },
        { tier: 'Pro', details: 'Full access' },
      ],
      versionHistory: [
        { version: '1.0', date: '2024-01', changes: 'Initial' },
        { version: '2.0', date: '2024-06', changes: 'Updated' },
      ],
    });
    expect(CapabilityEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('rejects entry with invalid category', () => {
    const entry = makeCapabilityEntry({ category: 'invalid' });
    expect(CapabilityEntrySchema.safeParse(entry).success).toBe(false);
  });
});

describe('SourceFileSchema', () => {
  it('accepts valid source file', () => {
    const data = {
      vendor: 'TestVendor',
      sources: [{ id: 'test-1', url: 'https://example.com/docs', title: 'Test Docs' }],
    };
    expect(SourceFileSchema.safeParse(data).success).toBe(true);
  });

  it('rejects source with invalid URL', () => {
    const data = {
      vendor: 'TestVendor',
      sources: [{ id: 'test-1', url: 'not-valid', title: 'Test' }],
    };
    expect(SourceFileSchema.safeParse(data).success).toBe(false);
  });

  it('rejects empty sources array', () => {
    const data = { vendor: 'TestVendor', sources: [] };
    expect(SourceFileSchema.safeParse(data).success).toBe(false);
  });
});

describe('SceneTypes', () => {
  it('has exactly 14 scene type entries', () => {
    expect(SCENE_TYPES).toHaveLength(14);
  });

  it('accepts valid scene types', () => {
    expect(SceneTypeSchema.safeParse('cover').success).toBe(true);
    expect(SceneTypeSchema.safeParse('journey-map').success).toBe(true);
    expect(SceneTypeSchema.safeParse('quote-card').success).toBe(true);
  });

  it('rejects invalid scene type', () => {
    expect(SceneTypeSchema.safeParse('invalid-type').success).toBe(false);
  });

  it('validates CoverContentSchema with stats', () => {
    const data = {
      eyebrow: 'Topic 1',
      title: ['Line 1', 'Line 2'],
      sub: 'Subtitle',
      stats: [{ id: 'stat-1', value: 50, suffix: 'min', label: 'Lessons' }],
    };
    expect(CoverContentSchema.safeParse(data).success).toBe(true);
  });

  it('validates CapabilityTableContentSchema cell values', () => {
    const valid = {
      eyebrow: 'E',
      title: 'T',
      headers: ['Tool1'],
      rows: [{ id: 'r1', label: 'Row', cells: ['B', 'Y', 'L', '-'] }],
    };
    expect(CapabilityTableContentSchema.safeParse(valid).success).toBe(true);

    const invalid = {
      eyebrow: 'E',
      title: 'T',
      headers: ['Tool1'],
      rows: [{ id: 'r1', label: 'Row', cells: ['X'] }],
    };
    expect(CapabilityTableContentSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates QuoteCardContentSchema', () => {
    const data = { eyebrow: 'Take', quote: 'Something', attribution: 'Author' };
    expect(QuoteCardContentSchema.safeParse(data).success).toBe(true);
  });
});

describe('LessonSchema', () => {
  it('accepts a valid lesson with correct timing', () => {
    const result = LessonSchema.safeParse(makeValidLesson());
    expect(result.success).toBe(true);
  });

  it('rejects lesson where scenes[0].start !== 0', () => {
    const lesson = makeValidLesson({
      scenes: [
        { id: 's1', type: 'cover', start: 1, duration: 8, content: { eyebrow: 'E', title: ['T'], sub: 'S' } },
      ],
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 9 },
    });
    expect(LessonSchema.safeParse(lesson).success).toBe(false);
  });

  it('rejects lesson with timing gap between scenes', () => {
    const lesson = makeValidLesson({
      scenes: [
        { id: 's1', type: 'cover', start: 0, duration: 8, content: { eyebrow: 'E', title: ['T'], sub: 'S' } },
        { id: 's2', type: 'recap-grid', start: 10, duration: 5, content: { eyebrow: 'E', title: 'T', cards: [] } },
      ],
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 15 },
    });
    expect(LessonSchema.safeParse(lesson).success).toBe(false);
  });

  it('rejects lesson where duration does not match scene sum', () => {
    const lesson = makeValidLesson({
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 99 },
    });
    expect(LessonSchema.safeParse(lesson).success).toBe(false);
  });

  it('rejects wrong schemaVersion', () => {
    const lesson = makeValidLesson({ schemaVersion: '2.0' });
    expect(LessonSchema.safeParse(lesson).success).toBe(false);
  });

  it('rejects empty object', () => {
    expect(LessonSchema.safeParse({}).success).toBe(false);
  });
});
