import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ToolSchema } from '../../content/schemas/tool';

// --- Types ---

export interface DiffResult {
  vendor: string;
  toolId: string;
  changedFields: string[];
  hasChanges: boolean;
  unmappedData: Record<string, unknown>;
}

export interface ApplyResult {
  applied: boolean;
  changedFields: string[];
  validationErrors?: string[];
}

// --- Path helper ---

export function getToolFilePath(
  toolId: string,
  basePath?: string,
): string {
  const dir = basePath ?? join(import.meta.dirname!, '..', '..', 'content', 'tools');
  return join(dir, `${toolId}.json`);
}

// --- Diff engine ---

export function diffToolData(
  toolId: string,
  scrapedData: Record<string, unknown>,
  basePath?: string,
): DiffResult {
  const filePath = getToolFilePath(toolId, basePath);

  if (!existsSync(filePath)) {
    // New tool — all scraped keys are changes
    const knownKeys = new Set(Object.keys(ToolSchema.shape));
    const changedFields: string[] = [];
    const unmappedData: Record<string, unknown> = {};

    for (const key of Object.keys(scrapedData)) {
      if (knownKeys.has(key)) {
        changedFields.push(key);
      } else {
        unmappedData[key] = scrapedData[key];
      }
    }

    return {
      vendor: (scrapedData.vendor as string) ?? 'unknown',
      toolId,
      changedFields,
      hasChanges: changedFields.length > 0 || Object.keys(unmappedData).length > 0,
      unmappedData,
    };
  }

  const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
  const knownKeys = new Set(Object.keys(ToolSchema.shape));
  const changedFields: string[] = [];
  const unmappedData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(scrapedData)) {
    if (!knownKeys.has(key)) {
      // D-07: unknown keys go to unmappedData
      unmappedData[key] = value;
      continue;
    }

    if (JSON.stringify(existing[key]) !== JSON.stringify(value)) {
      changedFields.push(key);
    }
  }

  return {
    vendor: existing.vendor ?? (scrapedData.vendor as string) ?? 'unknown',
    toolId,
    changedFields,
    hasChanges: changedFields.length > 0,
    unmappedData,
  };
}

// --- Apply diff ---

export function applyDiff(
  toolId: string,
  scrapedData: Record<string, unknown>,
  dryRun: boolean,
  basePath?: string,
): ApplyResult {
  const filePath = getToolFilePath(toolId, basePath);

  // Merge: existing data + scraped data (scraped overwrites known fields)
  let existing: Record<string, unknown> = {};
  if (existsSync(filePath)) {
    existing = JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  const knownKeys = new Set(Object.keys(ToolSchema.shape));
  const merged: Record<string, unknown> = { ...existing };
  const changedFields: string[] = [];

  for (const [key, value] of Object.entries(scrapedData)) {
    if (!knownKeys.has(key)) {
      // Skip unmapped data during apply — don't pollute the tool file
      continue;
    }
    if (JSON.stringify(existing[key]) !== JSON.stringify(value)) {
      changedFields.push(key);
    }
    merged[key] = value;
  }

  // Validate merged data against ToolSchema (T-04-01)
  const result = ToolSchema.safeParse(merged);

  if (!result.success) {
    return {
      applied: false,
      changedFields,
      validationErrors: result.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`,
      ),
    };
  }

  if (!dryRun && changedFields.length > 0) {
    writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  }

  return {
    applied: !dryRun && changedFields.length > 0,
    changedFields,
  };
}
