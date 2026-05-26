import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { diffToolData, applyDiff, getToolFilePath } from '../scripts/ingest/differ';
import { CAPABILITY_CATEGORIES } from '../content/schemas/capabilities';

// --- Factory ---

function makeCapabilityEntry(category: string) {
  return {
    category,
    supported: true,
    summary: `Summary for ${category}`,
    subFeatures: [{ name: 'Feature A', description: 'Desc A' }],
    limitations: ['Limit 1'],
    pricingTiers: [{ tier: 'Free', details: 'Basic' }],
    versionHistory: [{ version: '1.0', date: '2024-01', changes: 'Initial' }],
  };
}

function makeToolData(overrides: Record<string, unknown> = {}) {
  const capabilities: Record<string, unknown> = {};
  for (const cat of CAPABILITY_CATEGORIES) {
    capabilities[cat] = makeCapabilityEntry(cat);
  }
  return {
    id: 'test-tool',
    name: 'Test Tool',
    vendor: 'TestVendor',
    productId: 'test-tool',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P0',
    description: 'A test tool for testing',
    url: 'https://example.com',
    capabilities,
    sourceRefs: ['test-source-1'],
    ...overrides,
  };
}

// --- Tests ---

describe('differ', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'differ-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('diffToolData', () => {
    it('returns hasChanges false when scraped data matches existing', () => {
      const toolData = makeToolData();
      writeFileSync(join(tmpDir, 'test-tool.json'), JSON.stringify(toolData));

      const result = diffToolData('test-tool', toolData, tmpDir);
      expect(result.hasChanges).toBe(false);
      expect(result.changedFields).toEqual([]);
    });

    it('returns hasChanges true with changedFields when description differs', () => {
      const toolData = makeToolData();
      writeFileSync(join(tmpDir, 'test-tool.json'), JSON.stringify(toolData));

      const scraped = { ...toolData, description: 'Updated description' };
      const result = diffToolData('test-tool', scraped, tmpDir);
      expect(result.hasChanges).toBe(true);
      expect(result.changedFields).toContain('description');
    });

    it('captures unknown keys in unmappedData (D-07)', () => {
      const toolData = makeToolData();
      writeFileSync(join(tmpDir, 'test-tool.json'), JSON.stringify(toolData));

      const scraped = { ...toolData, newFeature: 'beta', releaseDate: '2026-01' };
      const result = diffToolData('test-tool', scraped, tmpDir);
      expect(result.unmappedData).toHaveProperty('newFeature', 'beta');
      expect(result.unmappedData).toHaveProperty('releaseDate', '2026-01');
    });

    it('handles non-existent tool file (new tool)', () => {
      const scraped = makeToolData({ id: 'new-tool' });
      const result = diffToolData('new-tool', scraped, tmpDir);
      expect(result.hasChanges).toBe(true);
      expect(result.changedFields.length).toBeGreaterThan(0);
    });

    it('detects multiple changed fields', () => {
      const toolData = makeToolData();
      writeFileSync(join(tmpDir, 'test-tool.json'), JSON.stringify(toolData));

      const scraped = {
        ...toolData,
        description: 'New desc',
        name: 'New Name',
        url: 'https://new-url.com',
      };
      const result = diffToolData('test-tool', scraped, tmpDir);
      expect(result.changedFields).toContain('description');
      expect(result.changedFields).toContain('name');
      expect(result.changedFields).toContain('url');
    });
  });

  describe('applyDiff', () => {
    it('writes updated data when valid and not dryRun', () => {
      const toolData = makeToolData();
      writeFileSync(join(tmpDir, 'test-tool.json'), JSON.stringify(toolData));

      const scraped = { ...toolData, description: 'Updated via apply' };
      const result = applyDiff('test-tool', scraped, false, tmpDir);
      expect(result.applied).toBe(true);
      expect(result.changedFields).toContain('description');

      const written = JSON.parse(readFileSync(join(tmpDir, 'test-tool.json'), 'utf-8'));
      expect(written.description).toBe('Updated via apply');
    });

    it('returns validationErrors when merged data is invalid', () => {
      const toolData = makeToolData();
      writeFileSync(join(tmpDir, 'test-tool.json'), JSON.stringify(toolData));

      // Apply invalid data: url is not a valid URL
      const scraped = { ...toolData, url: 'not-a-url' };
      const result = applyDiff('test-tool', scraped, false, tmpDir);
      expect(result.applied).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors!.length).toBeGreaterThan(0);
    });

    it('skips write in dryRun mode', () => {
      const toolData = makeToolData();
      writeFileSync(join(tmpDir, 'test-tool.json'), JSON.stringify(toolData));

      const scraped = { ...toolData, description: 'Should not be written' };
      const result = applyDiff('test-tool', scraped, true, tmpDir);
      expect(result.applied).toBe(false);
      expect(result.changedFields).toContain('description');

      const ondisk = JSON.parse(readFileSync(join(tmpDir, 'test-tool.json'), 'utf-8'));
      expect(ondisk.description).toBe('A test tool for testing');
    });

    it('preserves existing fields not in scraped data', () => {
      const toolData = makeToolData();
      writeFileSync(join(tmpDir, 'test-tool.json'), JSON.stringify(toolData));

      // Only send a partial update (description only)
      const scraped = { description: 'Partial update' };
      const result = applyDiff('test-tool', scraped, false, tmpDir);
      expect(result.applied).toBe(true);

      const written = JSON.parse(readFileSync(join(tmpDir, 'test-tool.json'), 'utf-8'));
      expect(written.description).toBe('Partial update');
      expect(written.id).toBe('test-tool');
      expect(written.vendor).toBe('TestVendor');
      expect(written.sourceRefs).toEqual(['test-source-1']);
    });
  });

  describe('getToolFilePath', () => {
    it('uses basePath when provided', () => {
      const path = getToolFilePath('chatgpt', '/custom/dir');
      expect(path).toContain('chatgpt.json');
      expect(path).toMatch(/custom/);
    });
  });
});
