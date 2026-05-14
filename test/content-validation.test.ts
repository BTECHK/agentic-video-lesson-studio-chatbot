import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { ToolSchema } from '../content/schemas/tool';
import { SourceFileSchema } from '../content/schemas/source';
import { CAPABILITY_CATEGORIES } from '../content/schemas/capabilities';
import {
  getAffectedScenes,
  getToolsAffectingScene,
} from '../content/mappings/scene-content-map';

const toolsDir = join(import.meta.dirname!, '..', 'content', 'tools');
const sourcesDir = join(import.meta.dirname!, '..', 'content', 'sources');

const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.json'));
const sourceFiles = readdirSync(sourcesDir).filter((f) => f.endsWith('.json'));

describe('Tool file validation', () => {
  it('should have exactly 12 tool files', () => {
    expect(toolFiles).toHaveLength(12);
  });

  for (const file of toolFiles) {
    describe(file, () => {
      const raw = JSON.parse(readFileSync(join(toolsDir, file), 'utf-8'));

      it('validates against ToolSchema', () => {
        const result = ToolSchema.safeParse(raw);
        if (!result.success) {
          const msgs = result.error.issues.map(
            (i) => `${i.path.join('.')}: ${i.message}`,
          );
          expect.fail(`Schema validation failed:\n${msgs.join('\n')}`);
        }
        expect(result.success).toBe(true);
      });

      it('has all 11 capability categories', () => {
        const keys = Object.keys(raw.capabilities ?? {});
        expect(keys).toHaveLength(CAPABILITY_CATEGORIES.length);
        for (const cat of CAPABILITY_CATEGORIES) {
          expect(keys).toContain(cat);
        }
      });
    });
  }
});

describe('Source file validation', () => {
  for (const file of sourceFiles) {
    it(`${file} validates against SourceFileSchema`, () => {
      const raw = JSON.parse(readFileSync(join(sourcesDir, file), 'utf-8'));
      const result = SourceFileSchema.safeParse(raw);
      if (!result.success) {
        const msgs = result.error.issues.map(
          (i) => `${i.path.join('.')}: ${i.message}`,
        );
        expect.fail(`Schema validation failed:\n${msgs.join('\n')}`);
      }
      expect(result.success).toBe(true);
    });
  }
});

describe('Cross-reference validation', () => {
  // Collect all source IDs
  const allSourceIds = new Set<string>();
  for (const file of sourceFiles) {
    const raw = JSON.parse(readFileSync(join(sourcesDir, file), 'utf-8'));
    const result = SourceFileSchema.safeParse(raw);
    if (result.success) {
      for (const s of result.data.sources) {
        allSourceIds.add(s.id);
      }
    }
  }

  for (const file of toolFiles) {
    it(`${file} sourceRefs all exist in source files`, () => {
      const raw = JSON.parse(readFileSync(join(toolsDir, file), 'utf-8'));
      const refs: string[] = raw.sourceRefs ?? [];
      const missing = refs.filter((ref) => !allSourceIds.has(ref));
      expect(missing).toEqual([]);
    });
  }
});

describe('Content-to-scene mapping', () => {
  it('getAffectedScenes with capabilities.writing-chat includes comparison-chats', () => {
    const scenes = getAffectedScenes('chatgpt', ['capabilities.writing-chat']);
    expect(scenes).toContain('comparison-chats');
  });

  it('getAffectedScenes with name includes tool-card-reveal', () => {
    const scenes = getAffectedScenes('chatgpt', ['name']);
    expect(scenes).toContain('tool-card-reveal');
  });

  it('getAffectedScenes with capabilities.dictation includes voice-demo', () => {
    const scenes = getAffectedScenes('chatgpt', ['capabilities.dictation']);
    expect(scenes).toContain('voice-demo');
  });

  it('getAffectedScenes with capabilities.writing-chat also includes capability-table from wildcard', () => {
    const scenes = getAffectedScenes('chatgpt', ['capabilities.writing-chat']);
    expect(scenes).toContain('capability-table');
    expect(scenes).toContain('feature-grid');
  });

  it('getAffectedScenes with description includes comparison-chats and capability-table', () => {
    const scenes = getAffectedScenes('chatgpt', ['description']);
    expect(scenes).toContain('comparison-chats');
    expect(scenes).toContain('capability-table');
  });

  it('getToolsAffectingScene for capability-table returns non-empty', () => {
    const paths = getToolsAffectingScene('capability-table');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('getToolsAffectingScene for voice-demo includes capabilities.dictation', () => {
    const paths = getToolsAffectingScene('voice-demo');
    expect(paths).toContain('capabilities.dictation');
  });

  it('getToolsAffectingScene for setup-checklist includes capabilities', () => {
    const paths = getToolsAffectingScene('setup-checklist');
    expect(paths).toContain('capabilities');
  });
});
