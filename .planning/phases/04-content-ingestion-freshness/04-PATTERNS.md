# Phase 4: Content Ingestion & Freshness - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 16 (10 new scripts, 1 config, 5 tests, 1 modified)
**Analogs found:** 14 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/ingest.ts` | controller | request-response | `scripts/pipeline.ts` | exact |
| `scripts/ingest/config.ts` | config | transform | `content/schemas/tool.ts` | role-match |
| `scripts/ingest/scraper.ts` | service | request-response | `scripts/verify.ts` (HTTP/parsing) | role-match |
| `scripts/ingest/extractor.ts` | utility | transform | `scripts/verify.ts` (data extraction) | partial |
| `scripts/ingest/llm-extract.ts` | service | request-response | (none -- novel) | -- |
| `scripts/ingest/differ.ts` | utility | transform | `scripts/compare.ts` | role-match |
| `scripts/ingest/pr-workflow.ts` | service | request-response | `scripts/pipeline.ts` (execSync) | partial |
| `scripts/ingest/scheduler.ts` | utility | config | (none -- OS-level, novel) | -- |
| `scripts/ingest/logger.ts` | utility | file-I/O | `scripts/verify.ts` (JSON report) | partial |
| `ingest.config.json` | config | -- | `content/sources/anthropic.json` | role-match |
| `test/ingest-config.test.ts` | test | -- | `test/schemas.test.ts` | exact |
| `test/scraper.test.ts` | test | -- | `test/validation.test.ts` | exact |
| `test/differ.test.ts` | test | -- | `test/schemas.test.ts` | exact |
| `test/ingest-validation.test.ts` | test | -- | `test/content-validation.test.ts` | exact |
| `test/pr-workflow.test.ts` | test | -- | `test/validation.test.ts` | role-match |
| `package.json` (modify) | config | -- | `package.json` (existing) | exact |

## Pattern Assignments

### `scripts/ingest.ts` (controller, request-response)

**Analog:** `scripts/pipeline.ts`

This is the main CLI entry point that orchestrates the ingestion pipeline, exactly like `pipeline.ts` orchestrates the render pipeline. It should follow the same structure: exported async function + CLI entry point at the bottom.

**Imports pattern** (lines 1-8):
```typescript
import path from 'path';
import fs from 'fs';
// New: project-specific module imports
import { loadConfig } from './ingest/config';
import { scrapeVendor } from './ingest/scraper';
import { diffToolData } from './ingest/differ';
import { createVendorPR } from './ingest/pr-workflow';
import { log } from './ingest/logger';
```

**Core orchestration pattern** (pipeline.ts lines 25-129):
```typescript
// Export an async function with an options param and typed return
export interface PipelineResult {
  renderCompleted: boolean;
  validationPassed: boolean;
  // ...
  outputPaths: { video: string; gallery: string; validationReport: string; };
}

export async function runPipeline(options?: {
  skipDeterminism?: boolean;
  referencesDir?: string;
}): Promise<PipelineResult> {
  // Step 1: ...
  console.log('[pipeline] Bundling project...');
  // Step 2: ...
  console.log('[pipeline] Validating render output...');
  // Step 3: ...
  console.log('[pipeline] Pipeline complete.');
  return result;
}
```

**CLI entry point pattern** (pipeline.ts lines 132-148):
```typescript
// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const skipDeterminism = args.includes('--skip-determinism');
  const refIdx = args.indexOf('--references');
  const referencesDir = refIdx >= 0 ? args[refIdx + 1] : undefined;

  runPipeline({ skipDeterminism, referencesDir })
    .then((result) => {
      if (!result.validationPassed) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
```

**Error handling pattern** (pipeline.ts lines 140-148):
```typescript
.catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

### `scripts/ingest/config.ts` (config, transform)

**Analog:** `content/schemas/tool.ts` (Zod schema pattern) + `scripts/validate-content.ts` (file loading pattern)

Defines Zod schemas for `ingest.config.json` and exports a `loadConfig()` function that reads, validates, and merges CLI overrides.

**Zod schema pattern** (tool.ts lines 1-2, 31-40):
```typescript
import { z } from 'zod';

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string(),
  priority: z.enum(['P0', 'P1']),
  description: z.string(),
  url: z.string().url(),
  capabilities: z.record(CapabilityCategorySchema, CapabilityEntrySchema),
  sourceRefs: z.array(z.string()),
});

export type Tool = z.infer<typeof ToolSchema>;
```

**File reading pattern** (validate-content.ts lines 1-4):
```typescript
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
```

**Directory resolution pattern** (validate-content.ts lines 12-13):
```typescript
const toolsDir = join(import.meta.dirname!, '..', 'content', 'tools');
const sourcesDir = join(import.meta.dirname!, '..', 'content', 'sources');
```

---

### `scripts/ingest/scraper.ts` (service, request-response)

**Analog:** `scripts/verify.ts` (external process execution + error handling)

The scraper makes HTTP requests and parses responses, similar to how `verify.ts` shells out to ffprobe and parses structured output.

**External call + error handling pattern** (verify.ts lines 169-212):
```typescript
export function extractMetadata(filePath: string): VideoMetadata {
  if (SHELL_METACHAR_PATTERN.test(filePath)) {
    throw new Error(
      `Invalid file path: contains shell metacharacters: ${filePath}`,
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let probeOutput: string;
  try {
    probeOutput = execSync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
      { encoding: 'utf-8' },
    );
  } catch {
    throw new Error('ffprobe not found -- is FFmpeg installed?');
  }

  const probe = JSON.parse(probeOutput);
  // ... extract structured data from parsed output
}
```

**Result type pattern** (verify.ts lines 8-19):
```typescript
export interface CheckResult {
  passed: boolean;
  [key: string]: unknown;
}
```

---

### `scripts/ingest/extractor.ts` (utility, transform)

**Analog:** `scripts/verify.ts` (data extraction from raw input)

Extracts structured data from parsed HTML using cheerio selectors. Similar to how `verify.ts` extracts structured metadata from ffprobe JSON output.

**Data extraction pattern** (verify.ts lines 190-211):
```typescript
const probe = JSON.parse(probeOutput);
const videoStream = probe.streams?.find(
  (s: { codec_type: string }) => s.codec_type === 'video',
);

const fileSize = parseInt(probe.format?.size ?? '0', 10);
const width = videoStream?.width ?? 0;
const height = videoStream?.height ?? 0;
// ... etc.

return { fileSize, width, height, fps, duration };
```

---

### `scripts/ingest/differ.ts` (utility, transform)

**Analog:** `scripts/compare.ts` (frame comparison)

Compares scraped data against existing tool JSON files to detect changes. Same comparison-and-report pattern as frame comparison.

**File reading for comparison** (validate-content.ts lines 24-26):
```typescript
const filePath = join(toolsDir, file);
const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
const result = ToolSchema.safeParse(raw);
```

**Result reporting pattern** (pipeline.ts lines 113-125):
```typescript
if (!comparison.allMatch) {
  console.warn('[pipeline] Some frames differ from reference snapshots:');
  for (const [file, res] of Object.entries(comparison.results)) {
    if (!res.match) {
      console.warn(`  ${file}: ${(res.diffPercent * 100).toFixed(2)}% diff`);
    }
  }
} else {
  console.log('[pipeline] All frames match reference snapshots.');
}
```

---

### `scripts/ingest/pr-workflow.ts` (service, request-response)

**Analog:** `scripts/pipeline.ts` (execSync usage for external tool invocation)

Uses `execSync` to run git and gh CLI commands, following the same pattern as pipeline.ts.

**execSync pattern** (verify.ts lines 181-189):
```typescript
import { execSync } from 'child_process';

let probeOutput: string;
try {
  probeOutput = execSync(
    `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
    { encoding: 'utf-8' },
  );
} catch {
  throw new Error('ffprobe not found -- is FFmpeg installed?');
}
```

**Input sanitization pattern** (verify.ts lines 44-45, 170-174):
```typescript
const SHELL_METACHAR_PATTERN = /[;|&$`]/;

if (SHELL_METACHAR_PATTERN.test(filePath)) {
  throw new Error(
    `Invalid file path: contains shell metacharacters: ${filePath}`,
  );
}
```

---

### `scripts/ingest/logger.ts` (utility, file-I/O)

**Analog:** `scripts/verify.ts` (JSON report writing)

Writes structured JSON to files, following the same pattern as validation report output.

**JSON file writing pattern** (verify.ts lines 306-313):
```typescript
const reportDir = path.join(process.cwd(), 'output/validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, 'report.json'),
  JSON.stringify(result, null, 2),
);
```

---

### `ingest.config.json` (config)

**Analog:** `content/sources/anthropic.json` (JSON config file structure)

Follows the same vendor-keyed JSON structure as existing source files.

**JSON structure pattern** (anthropic.json):
```json
{
  "vendor": "Anthropic",
  "sources": [
    {
      "id": "anthropic-models",
      "url": "https://docs.anthropic.com/en/docs/about-claude/models",
      "title": "Claude Models Overview"
    }
  ]
}
```

---

### `test/ingest-config.test.ts` (test)

**Analog:** `test/schemas.test.ts`

Tests Zod schema validation for `IngestConfigSchema`, following the exact same pattern as existing schema tests.

**Test structure pattern** (schemas.test.ts lines 1-6):
```typescript
import { describe, it, expect } from 'vitest';
import {
  CapabilityCategorySchema,
  CAPABILITY_CATEGORIES,
  ToolSchema,
  // ...
} from '../content/schemas';
```

**Helper factory pattern** (schemas.test.ts lines 19-48):
```typescript
function makeCapabilityEntry(overrides: Record<string, unknown> = {}) {
  return {
    category: 'writing-chat',
    supported: true,
    summary: 'General writing and chat',
    // ... defaults
    ...overrides,
  };
}

function makeMinimalTool(overrides: Record<string, unknown> = {}) {
  // ... build valid object with all required fields
  return { ...defaults, ...overrides };
}
```

**Zod validation test pattern** (schemas.test.ts lines 87-106):
```typescript
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
});
```

---

### `test/scraper.test.ts` (test)

**Analog:** `test/validation.test.ts`

Tests HTTP scraping, cheerio extraction, robots.txt checking, and error handling. Follows the fixture-based testing pattern.

**Fixture setup pattern** (validation.test.ts lines 1-5, 17-61):
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('Post-Render Validation', () => {
  beforeAll(async () => {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    // Create test fixtures...
  });

  // Tests that use fixtures...
});
```

**Async test pattern** (validation.test.ts lines 144-164):
```typescript
describe('detectBlankFrame', () => {
  it('returns true for all-white image', async () => {
    const result = await detectBlankFrame(
      path.join(FIXTURES_DIR, 'blank-white.png'),
    );
    expect(result).toBe(true);
  });
});
```

---

### `test/differ.test.ts` (test)

**Analog:** `test/schemas.test.ts`

Tests diff detection logic with factory helpers. Pure unit tests with no I/O.

**Same factory + safeParse test pattern as `test/schemas.test.ts` above.**

---

### `test/ingest-validation.test.ts` (test)

**Analog:** `test/content-validation.test.ts`

Tests that scraped data validates against existing schemas. Follows the same file-reading + schema validation test pattern.

**File-based validation test pattern** (content-validation.test.ts lines 1-7, 18-46):
```typescript
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { ToolSchema } from '../content/schemas/tool';
import { SourceFileSchema } from '../content/schemas/source';

const toolsDir = join(import.meta.dirname!, '..', 'content', 'tools');

describe('Tool file validation', () => {
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
    });
  }
});
```

---

### `test/pr-workflow.test.ts` (test)

**Analog:** `test/validation.test.ts`

Tests git branch creation and PR creation, mocking execSync. Follows same describe/it structure.

---

### `package.json` (modify)

**Analog:** Self (existing `package.json`)

**Existing npm scripts pattern** (package.json lines 6-11):
```json
{
  "scripts": {
    "studio": "remotion studio",
    "render": "remotion render src/index.ts",
    "build": "remotion bundle src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "validate:content": "tsx scripts/validate-content.ts"
  }
}
```

New scripts should follow the `"command": "tsx scripts/..."` pattern used by `validate:content`.

---

## Shared Patterns

### Zod Schema Validation
**Source:** `content/schemas/tool.ts` lines 1-2, 31-40
**Apply to:** `scripts/ingest/config.ts`, `scripts/ingest/extractor.ts`, `scripts/ingest/differ.ts`
```typescript
import { z } from 'zod';

// Define schema
export const MySchema = z.object({ /* fields */ });

// Export inferred type
export type MyType = z.infer<typeof MySchema>;

// Validate with safeParse (not parse -- never throw on user data)
const result = MySchema.safeParse(data);
if (!result.success) {
  // Handle error.issues
}
```

### File Reading + JSON Parsing
**Source:** `scripts/validate-content.ts` lines 1-4, 24-26
**Apply to:** `scripts/ingest/config.ts`, `scripts/ingest/differ.ts`
```typescript
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

// Use import.meta.dirname for path resolution
const baseDir = join(import.meta.dirname!, '..', 'content', 'tools');
const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
```

### Console Output Formatting
**Source:** `scripts/validate-content.ts` lines 5-9
**Apply to:** `scripts/ingest.ts`, `scripts/ingest/logger.ts`
```typescript
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
```

### CLI Entry Point
**Source:** `scripts/pipeline.ts` lines 132-148
**Apply to:** `scripts/ingest.ts`
```typescript
if (require.main === module) {
  const args = process.argv.slice(2);
  // Parse flags from args
  runFunction(parsedOptions)
    .then((result) => {
      if (!result.success) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
```

### Shell Command Execution
**Source:** `scripts/verify.ts` lines 1, 44-45, 170-189
**Apply to:** `scripts/ingest/pr-workflow.ts`, `scripts/ingest/scheduler.ts`
```typescript
import { execSync } from 'child_process';

// Input sanitization before shell commands
const SHELL_METACHAR_PATTERN = /[;|&$`]/;
if (SHELL_METACHAR_PATTERN.test(input)) {
  throw new Error(`Invalid input: contains shell metacharacters: ${input}`);
}

// execSync with encoding for string output
const output = execSync(`command "${safeInput}"`, { encoding: 'utf-8' });
```

### Test File Structure
**Source:** `test/schemas.test.ts` lines 1-6, 66-86
**Apply to:** All test files
```typescript
import { describe, it, expect } from 'vitest';
// Import from source under test

describe('ModuleName', () => {
  it('accepts valid input', () => {
    expect(result).toBe(true);
  });

  it('rejects invalid input', () => {
    expect(result).toBe(false);
  });
});
```

### Test Factory Helpers
**Source:** `test/schemas.test.ts` lines 19-48
**Apply to:** `test/ingest-config.test.ts`, `test/differ.test.ts`
```typescript
function makeMinimalThing(overrides: Record<string, unknown> = {}) {
  return {
    // all required fields with valid defaults
    field1: 'default',
    field2: true,
    ...overrides,
  };
}
```

### TypeScript Conventions
**Source:** `tsconfig.json`
**Apply to:** All new TypeScript files
- Target: ES2022, Module: ES2022, moduleResolution: bundler
- `import.meta.dirname` available (ES2022 target)
- `node:` protocol for Node.js built-in imports (`import { readFileSync } from 'node:fs'`)
- Strict mode enabled
- Files in `scripts/` and `test/` are included in tsconfig

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/ingest/llm-extract.ts` | service | request-response | No LLM invocation pattern exists in the codebase. Claude Code passthrough is a novel integration. Planner should use RESEARCH.md patterns (structured prompt output for manual paste into Claude Code session) |
| `scripts/ingest/scheduler.ts` | utility | config | No OS-level scheduling (schtasks) pattern exists. Planner should use RESEARCH.md code example (schtasks /create command) and follow the `execSync` shared pattern |

## Metadata

**Analog search scope:** `scripts/`, `content/schemas/`, `content/sources/`, `test/`
**Files scanned:** 25 (6 scripts, 6 schemas, 11 sources, 8 tests, package.json, tsconfig.json, vitest.config.ts)
**Pattern extraction date:** 2026-05-14
