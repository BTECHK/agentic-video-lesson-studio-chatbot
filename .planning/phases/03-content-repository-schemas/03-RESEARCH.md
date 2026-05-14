# Phase 3: Content Repository & Schemas - Research

**Researched:** 2026-05-13
**Domain:** Content data modeling, Zod schema validation, Remotion data-driven rendering
**Confidence:** HIGH

## Summary

Phase 3 builds a structured, Git-versioned knowledge base of AI tool capabilities (12 tools x 11 categories = 132 capability entries) with Zod-validated schemas, plus the animation architecture prep (JSON content loader, lesson schema, scene type dispatcher) that bridges this content to Remotion rendering in Phase 2.

The project already has Zod 4.3.6 and Remotion 4.0.460 installed. Remotion 4.0.426+ natively supports Zod 4 schemas via the `schema` prop on `<Composition>`, which means the lesson schema and tool schema can share Zod as a single validation layer across both content authoring and rendering. The Claude Design session output provides complete, locked contracts for 13 scene types with content schemas, a motion contract, and a JSON lesson schema (v1.0) -- these are the target shapes to implement in Zod.

The primary challenge is data population: 132 capability entries with deep feature breakdowns, limitations, pricing tiers, and version history -- all with official source citations. This is a substantial manual research effort, not a technical complexity problem.

**Primary recommendation:** Define Zod schemas first (tool, source, lesson), then populate all 12 tool JSON files with real data, then build the scene type dispatcher as a `type` string -> Remotion component map. Use `resolveJsonModule` (already enabled in tsconfig) for build-time imports and `staticFile()` + `fetch()` for runtime loading in Remotion.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** One JSON file per tool -- e.g. `content/tools/chatgpt.json`, `content/tools/claude.json`. Each file contains all 11 capability categories for that tool.
- **D-02:** All 12 tools (P0 + P1) fully populated with real data from day one. No stubs, no placeholder content. P0: ChatGPT, Claude, Gemini, Perplexity, Codex, Claude Code, Cowork. P1: Grok, DeepSeek, Qwen, Comet, Manus.
- **D-03:** The 11 capability categories are a fixed Zod enum: writing-chat, research, file-analysis, document-creation, image-generation, prototyping, personalization, persistent-context, agents, connectors, dictation. Adding a category requires a schema change.
- **D-04:** Each tool's capability entry contains a full feature breakdown: sub-features, limitations, pricing tier differences, version history. Deep technical detail -- not just ratings and summaries.
- **D-05:** Source citations live in separate bibliography files, one per vendor -- e.g. `content/sources/openai.json`, `content/sources/anthropic.json`. Tool files reference sources by ID (e.g. `"sourceRef": "openai-models"`).
- **D-06:** Git history is the source of truth for freshness tracking. No `verifiedAt` or `lastCheckedAt` fields in source entries. `git log` on source files determines when each source was last verified. Source entries contain: URL, title, and a stable ID.
- **D-07:** Per-vendor source files align with Phase 4 scrapers -- each scraper updates one vendor's sources at a time.

### Claude's Discretion
- **D-08:** Content-to-scene mapping -- the mapping from content nodes to video scenes (CONT-04). The design system's scene catalog defines scene types with content schemas. The mapping should enable "tool X changed -> these scenes need re-rendering."
- **D-09:** Animation architecture prep -- scope and implementation of the JSON content loader, Zod lesson schema, and scene type dispatcher. The Claude Design session's contracts and existing code patterns establish the targets.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | Structured schema for AI tool capabilities (11 categories across P0/P1 tools) | Zod 4 discriminated unions + enum for capability categories; one JSON per tool (D-01); full feature breakdown schema (D-04) |
| CONT-02 | Official source attribution for every factual claim with URL and verification date | Per-vendor bibliography files (D-05); source entries with URL, title, stable ID; git history for freshness (D-06) |
| CONT-03 | Git-versioned content with structured change history | JSON files in `content/` committed to git; `git log` per file tracks changes; no separate change tracking needed |
| CONT-04 | Content-to-scene mapping metadata linking content nodes to specific video sections | Scene registry mapping tool data to scene types; `sceneHints` field on capability entries linking to scene catalog types |
| CONT-05 | Zod-validated content schemas catching structural errors before render | Zod 4 schemas for tool files, source files, and lesson JSON; CLI validation script; Remotion `schema` prop integration |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tool knowledge base (JSON files) | Database / Storage | -- | Static JSON files in git are the persistence layer |
| Zod schema validation | API / Backend | Frontend Server (SSR) | Validation runs at build time and in CLI scripts, not in browser |
| Source bibliography | Database / Storage | -- | Static JSON files, same storage pattern as tool data |
| Content-to-scene mapping | API / Backend | Browser / Client | Mapping logic lives in TypeScript modules consumed by Remotion at render time |
| Lesson JSON schema | API / Backend | Browser / Client | Schema validates at build time; Remotion consumes validated data at render time |
| Scene type dispatcher | Browser / Client | -- | React component mapping runs in Remotion's browser rendering context |
| JSON content loader | Browser / Client | -- | Remotion's `staticFile()` + `fetch()` loads JSON at render time in browser |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.3.6 (installed), 4.4.3 (latest) | Schema validation for all JSON content | Already in project; Remotion 4.0.426+ has native Zod 4 support via `schema` prop [VERIFIED: npm registry, package.json] |
| remotion | 4.0.460 | Video rendering framework, composition schema integration | Already installed; `<Composition schema={}>` prop validates props with Zod [VERIFIED: Context7 /remotion-dev/remotion] |
| typescript | 6.0.3 | Type safety, `resolveJsonModule` for JSON imports | Already configured with strict mode and `resolveJsonModule: true` [VERIFIED: tsconfig.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.6 | Test runner for schema validation tests | Already configured; use for all content validation tests [VERIFIED: vitest.config.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod | JSON Schema (ajv) | Zod provides TypeScript type inference and is already integrated with Remotion's `schema` prop -- JSON Schema would require a separate validation step |
| Static JSON files | SQLite / PostgreSQL | Overkill for 12 tool files; Git versioning on JSON files satisfies CONT-03; database adds deployment complexity for no benefit at this scale |
| Manual JSON authoring | YAML with conversion | JSON is directly consumable by TypeScript/Remotion; YAML adds a build step and no real benefit for structured data |

**Installation:**
No new packages needed. All dependencies are already installed.

**Version verification:**
```
zod: 4.3.6 installed, 4.4.3 available (minor bump, compatible) [VERIFIED: npm view zod version]
remotion: 4.0.460 (latest) [VERIFIED: npm view remotion version]
vitest: 4.1.6 (latest) [VERIFIED: npx vitest --version]
typescript: 6.0.3 [VERIFIED: package.json]
```

## Architecture Patterns

### System Architecture Diagram

```
content/tools/*.json ──────────┐
  (12 tool files, Zod-validated)│
                                ├──> Zod Schema Layer ──> TypeScript Types
content/sources/*.json ────────┘       (validate at     (z.infer<typeof>)
  (per-vendor bibliography)            build/CLI time)
                                            │
                                            v
                                   content/lessons/*.json
                                   (lesson JSON, scene array)
                                            │
                                            v
                               ┌─── Scene Type Dispatcher ───┐
                               │   (type string -> component) │
                               └──────────┬──────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    v                     v                     v
              CoverScene          ComparisonChats        CapabilityTable
              (Remotion)            (Remotion)             (Remotion)
                    │                     │                     │
                    └─────────────────────┼─────────────────────┘
                                          v
                                  <Composition schema={}>
                                   (Remotion renders MP4)
```

### Recommended Project Structure
```
content/
  tools/                    # One JSON per tool (D-01)
    chatgpt.json
    claude.json
    gemini.json
    perplexity.json
    codex.json
    claude-code.json
    cowork.json
    grok.json
    deepseek.json
    qwen.json
    comet.json
    manus.json
  sources/                  # Per-vendor bibliography (D-05)
    openai.json             # covers ChatGPT + Codex
    anthropic.json          # covers Claude + Claude Code + Cowork
    google.json             # covers Gemini
    perplexity.json
    xai.json                # covers Grok
    deepseek.json
    alibaba.json            # covers Qwen
    comet.json
    manus.json
  lessons/                  # Lesson JSON files (Phase 2 consumes)
    module-1.json
src/
  content/                  # Schema definitions and loaders
    schemas/
      tool.ts               # Zod schema for tool JSON files
      source.ts             # Zod schema for source bibliography
      lesson.ts             # Zod schema for lesson JSON (from design system 05-content-schema.md)
      scene-content.ts      # Per-scene-type content schemas (from 03-scene-catalog.md)
      capability.ts         # Capability enum and entry schema
      index.ts              # Re-exports
    loader.ts               # JSON content loader (staticFile + fetch for Remotion)
    validator.ts            # CLI validation script (validate all content/)
    scene-map.ts            # Content-to-scene mapping (CONT-04)
  compositions/
    scenes/                 # Existing + new scene components
      index.ts              # Scene type dispatcher (type -> component)
```

### Pattern 1: Zod Discriminated Union for Scene Content

The lesson schema's `scenes` array contains objects of different types, each with a different `content` shape. Zod 4's `z.discriminatedUnion()` handles this cleanly.

**What:** Each scene in a lesson has a `type` field that determines the shape of `content`.
**When to use:** Always, for the lesson JSON schema.
**Example:**
```typescript
// Source: Context7 /colinhacks/zod - z.discriminatedUnion()
// Source: 03-scene-catalog.md scene types

import { z } from 'zod';

const SceneTypeEnum = z.enum([
  'cover', 'journey-map', 'comparison-chats', 'tool-card-reveal',
  'capability-table', 'setup-checklist', 'feature-grid', 'voice-demo',
  'recap-grid', 'preview-band', 'demo-cue', 'assignment-list', 'quote-card',
]);

const CoverContentSchema = z.object({
  eyebrow: z.string(),
  title: z.array(z.string()),
  sub: z.string(),
  stats: z.array(z.object({
    id: z.string(),
    value: z.number(),
    suffix: z.string().optional(),
    label: z.string(),
  })).optional(),
});

const BaseSceneFields = {
  id: z.string(),
  start: z.number(),
  duration: z.number(),
  label: z.string().optional(),
};

const CoverScene = z.object({
  ...BaseSceneFields,
  type: z.literal('cover'),
  content: CoverContentSchema,
});

// ... repeat for each scene type

const SceneSchema = z.discriminatedUnion('type', [
  CoverScene,
  JourneyMapScene,
  ComparisonChatsScene,
  // ... all 13 types
]);
```

### Pattern 2: Capability Category Enum with Feature Breakdown

**What:** Fixed enum for 11 capability categories (D-03) with deep feature breakdown (D-04).
**When to use:** For tool JSON file validation.
**Example:**
```typescript
// Source: CONTEXT.md D-03, D-04

const CapabilityCategory = z.enum([
  'writing-chat', 'research', 'file-analysis', 'document-creation',
  'image-generation', 'prototyping', 'personalization',
  'persistent-context', 'agents', 'connectors', 'dictation',
] as const);

const PricingTier = z.enum(['free', 'pro', 'team', 'enterprise'] as const);

const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  available: z.boolean(),
  tiers: z.array(PricingTier),
  limitations: z.string().optional(),
  sourceRefs: z.array(z.string()),  // references to bibliography entry IDs
});

const CapabilityEntrySchema = z.object({
  category: CapabilityCategory,
  supported: z.boolean(),
  summary: z.string(),
  features: z.array(FeatureSchema),
  versionHistory: z.array(z.object({
    version: z.string(),
    date: z.string(),
    changes: z.string(),
  })).optional(),
  sceneHints: z.array(SceneTypeEnum).optional(),  // CONT-04: which scene types can render this
});
```

### Pattern 3: Source Bibliography with Stable IDs

**What:** Per-vendor source files with stable IDs referenced by tool data (D-05, D-06).
**When to use:** For source attribution validation.
**Example:**
```typescript
// Source: CONTEXT.md D-05, D-06

const SourceEntrySchema = z.object({
  id: z.string(),       // stable ID, e.g. "openai-models-gpt4o"
  url: z.string().url(),
  title: z.string(),
});

const SourceFileSchema = z.object({
  vendor: z.string(),
  entries: z.array(SourceEntrySchema),
});
```

### Pattern 4: Scene Type Dispatcher

**What:** Maps JSON scene `type` strings to Remotion React components.
**When to use:** When rendering a lesson from JSON.
**Example:**
```typescript
// Source: 04-component-api.md composition pattern
// Source: existing BrandShowcase.tsx Sequence pattern

import React from 'react';
import { Sequence } from 'remotion';
import { BRAND } from '../brand/tokens';

// Registry of scene type -> component
const SCENE_COMPONENTS: Record<string, React.FC<{ scene: any; sceneStart: number }>> = {
  'cover': CoverScene,
  'journey-map': JourneyMapScene,
  'comparison-chats': ComparisonChatsScene,
  // ... all 13 types
};

// Dispatcher: renders scenes from lesson JSON
export const LessonRenderer: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  return (
    <>
      {scenes.map((scene) => {
        const Component = SCENE_COMPONENTS[scene.type];
        if (!Component) throw new Error(`Unknown scene type: ${scene.type}`);
        const startFrame = scene.start * BRAND.video.fps;
        const durationFrames = scene.duration * BRAND.video.fps;
        return (
          <Sequence key={scene.id} from={startFrame} durationInFrames={durationFrames}>
            <Component scene={scene} sceneStart={scene.start} />
          </Sequence>
        );
      })}
    </>
  );
};
```

### Pattern 5: Content Loading in Remotion

**What:** Load lesson JSON at render time using Remotion's `staticFile()` + `fetch()` pattern with `delayRender`.
**When to use:** When a Remotion composition needs to consume lesson JSON.
**Example:**
```typescript
// Source: Context7 /remotion-dev/remotion - staticFile + delayRender

import { useState, useEffect } from 'react';
import { staticFile, delayRender, continueRender, cancelRender } from 'remotion';

export function useLessonData(lessonId: string) {
  const [handle] = useState(() => delayRender(`Loading lesson: ${lessonId}`));
  const [data, setData] = useState<LessonData | null>(null);

  useEffect(() => {
    fetch(staticFile(`lessons/${lessonId}.json`))
      .then((res) => res.json())
      .then((json) => {
        const parsed = LessonSchema.parse(json);  // Zod validation at load time
        setData(parsed);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle, lessonId]);

  return data;
}
```

### Anti-Patterns to Avoid
- **Inline content in React components:** Never hardcode tool data or lesson content in .tsx files. All content lives in JSON files validated by Zod schemas.
- **Dynamic schema generation:** Don't generate Zod schemas at runtime. Define them statically so TypeScript can infer types at compile time.
- **Circular references in content:** Tool files reference source IDs, not source objects. Source files don't reference tools. One-directional dependency.
- **`verifiedAt` fields in content:** Per D-06, git history tracks freshness. Adding timestamp fields to JSON creates a dual source of truth.
- **`z.nativeEnum()` usage:** Deprecated in Zod 4. Use `z.enum()` directly, which now supports TypeScript enums and enum-like objects. [VERIFIED: Context7 /websites/zod_dev_v4]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom JSON validators | Zod 4 `z.object()`, `z.discriminatedUnion()`, `z.enum()` | Type inference, error messages, Remotion integration |
| Content freshness tracking | Custom `lastModified` fields in JSON | `git log --follow -1 --format='%aI' -- <file>` | D-06 locks this decision; git is already the source of truth |
| Scene type routing | `if/else` or `switch` chains in JSX | `Record<string, React.FC>` dispatcher map | Type-safe, extensible, single place to register new scene types |
| JSON loading in Remotion | Direct `fs.readFileSync` | `staticFile()` + `fetch()` + `delayRender()` | Remotion's rendering model requires async loading with render delay |
| Schema-to-type derivation | Separate TypeScript interfaces | `z.infer<typeof Schema>` | Single source of truth; schema and type always in sync |

**Key insight:** Zod 4 + Remotion 4's native schema integration means the validation layer and the rendering layer share the same type definitions. Don't create separate TypeScript interfaces for content shapes -- derive them from Zod schemas with `z.infer<>`.

## Common Pitfalls

### Pitfall 1: Zod 4 API Differences from Zod 3
**What goes wrong:** Using `z.nativeEnum()` (deprecated), `.Enum`/`.Values` properties (removed), or expecting `.nonempty()` to infer tuple types.
**Why it happens:** Most online examples and training data reference Zod 3 API.
**How to avoid:** Use `z.enum()` for all enums. Use `.enum` (lowercase) to access values. Use `.min(1)` instead of `.nonempty()` for non-empty arrays.
**Warning signs:** TypeScript errors mentioning `nativeEnum is not a function` or missing `.Enum` property. [VERIFIED: Context7 /websites/zod_dev_v4]

### Pitfall 2: Defaults in Optional Fields (Zod 4 Behavior Change)
**What goes wrong:** `z.string().default("value").optional()` returns `{ a: "value" }` on `parse({})` in Zod 4, but returned `{}` in Zod 3.
**Why it happens:** Zod 4 changed this behavior to align with common expectations.
**How to avoid:** Be explicit: if you want a field to be truly absent when not provided, use `.optional()` without `.default()`. If you want a default, put `.default()` and expect it to always be present.
**Warning signs:** Tests failing because parsed output has unexpected fields. [VERIFIED: Context7 /websites/zod_dev_v4]

### Pitfall 3: Scene Timing Constraint Violations
**What goes wrong:** Lesson JSON has gaps or overlaps between scenes, or `lesson.duration` doesn't match the sum of scene durations.
**Why it happens:** Manual editing of scene `start`/`duration` values without recalculating the chain.
**How to avoid:** Add a Zod `.refine()` on the lesson schema that verifies: `scenes[0].start === 0`, each adjacent pair is contiguous, and `lesson.duration === last.start + last.duration`. Run this validation in a pre-commit hook or CLI script.
**Warning signs:** Scenes rendering at wrong times or with blank gaps. [VERIFIED: 05-content-schema.md timing constraints]

### Pitfall 4: Source Reference Integrity
**What goes wrong:** Tool JSON references a source ID (e.g. `"openai-models"`) that doesn't exist in the corresponding vendor source file.
**Why it happens:** Source files and tool files edited independently.
**How to avoid:** Build a cross-file validation script that loads all source files, builds a set of valid IDs, then checks all `sourceRefs` in tool files against that set. Run as part of CI.
**Warning signs:** Chatbot (Phase 5) returning "source not found" for citations.

### Pitfall 5: Content File Size and Git Performance
**What goes wrong:** Tool JSON files with deep feature breakdowns become very large (10-50KB each), making git diffs noisy.
**Why it happens:** 132 capability entries with full detail is a lot of structured data.
**How to avoid:** Keep JSON formatted with 2-space indent for readable diffs. Avoid storing binary data (images, logos) in the JSON -- reference them by ID. Consider splitting very large tool files if they exceed ~50KB, but start with one file per tool (D-01).
**Warning signs:** Pull request diffs with 500+ changed lines in a single JSON file.

### Pitfall 6: Remotion staticFile Path Issues
**What goes wrong:** `staticFile('lessons/module-1.json')` fails because the file isn't in `public/`.
**Why it happens:** Remotion's `staticFile()` resolves paths relative to the `public/` directory, not the project root.
**How to avoid:** Either place lesson JSON in `public/lessons/` or use `calculateMetadata` to load data at composition setup time (before render). For build-time validation, import JSON directly via `resolveJsonModule`.
**Warning signs:** `cancelRender` errors about 404s during rendering. [VERIFIED: Context7 /remotion-dev/remotion staticFile usage]

## Code Examples

### Validated Tool File Schema (Complete)
```typescript
// Source: CONTEXT.md D-01 through D-07
// Source: Context7 /colinhacks/zod - z.enum, z.object, z.discriminatedUnion

import { z } from 'zod';

export const CapabilityCategory = z.enum([
  'writing-chat',
  'research',
  'file-analysis',
  'document-creation',
  'image-generation',
  'prototyping',
  'personalization',
  'persistent-context',
  'agents',
  'connectors',
  'dictation',
] as const);

export type CapabilityCategory = z.infer<typeof CapabilityCategory>;

export const PricingTier = z.enum(['free', 'pro', 'team', 'enterprise'] as const);

export const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  available: z.boolean(),
  tiers: z.array(PricingTier).min(1),
  limitations: z.string().optional(),
  sourceRefs: z.array(z.string()).min(1),
});

export const VersionEntry = z.object({
  version: z.string(),
  date: z.string(),
  changes: z.string(),
});

export const CapabilityEntry = z.object({
  category: CapabilityCategory,
  supported: z.boolean(),
  summary: z.string(),
  features: z.array(FeatureSchema),
  versionHistory: z.array(VersionEntry).optional(),
  sceneHints: z.array(z.string()).optional(),
});

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string(),
  logoId: z.string(),
  tier: z.enum(['p0', 'p1'] as const),
  capabilities: z.array(CapabilityEntry).length(11),
});

export type Tool = z.infer<typeof ToolSchema>;
```

### Source Bibliography Schema
```typescript
// Source: CONTEXT.md D-05, D-06

import { z } from 'zod';

export const SourceEntry = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
});

export const SourceFile = z.object({
  vendor: z.string(),
  entries: z.array(SourceEntry).min(1),
});

export type SourceEntry = z.infer<typeof SourceEntry>;
export type SourceFile = z.infer<typeof SourceFile>;
```

### Content Validation CLI Script
```typescript
// Source: Project pattern from scripts/verify.ts (Phase 1)

import fs from 'fs';
import path from 'path';
import { ToolSchema } from '../src/content/schemas/tool';
import { SourceFile } from '../src/content/schemas/source';

function validateContent(contentDir: string): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Validate all tool files
  const toolDir = path.join(contentDir, 'tools');
  for (const file of fs.readdirSync(toolDir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(toolDir, file), 'utf-8'));
    const result = ToolSchema.safeParse(data);
    if (!result.success) {
      errors.push(`${file}: ${result.error.message}`);
    }
  }

  // 2. Validate all source files
  const sourceDir = path.join(contentDir, 'sources');
  for (const file of fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf-8'));
    const result = SourceFile.safeParse(data);
    if (!result.success) {
      errors.push(`${file}: ${result.error.message}`);
    }
  }

  // 3. Cross-reference: all sourceRefs in tool files exist in source files
  const allSourceIds = new Set<string>();
  // ... collect IDs from source files, then check tool file references

  return { passed: errors.length === 0, errors };
}
```

### Remotion Composition with Zod Schema
```typescript
// Source: Context7 /remotion-dev/remotion - schema prop on Composition
// Source: 05-content-schema.md lesson structure

import { Composition, CalculateMetadataFunction } from 'remotion';
import { z } from 'zod';
import { LessonSchema } from '../content/schemas/lesson';
import { LessonRenderer } from './LessonRenderer';
import { BRAND } from '../brand/tokens';

type LessonProps = z.infer<typeof LessonSchema>;

const calculateMetadata: CalculateMetadataFunction<LessonProps> = ({ props }) => {
  return {
    durationInFrames: props.lesson.duration * BRAND.video.fps,
    props,
  };
};

// In Root.tsx
<Composition
  id="Lesson"
  component={LessonRenderer}
  fps={BRAND.video.fps}
  width={BRAND.video.width}
  height={BRAND.video.height}
  durationInFrames={300}  // overridden by calculateMetadata
  schema={LessonSchema}
  defaultProps={defaultLesson}
  calculateMetadata={calculateMetadata}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `z.nativeEnum()` for TS enums | `z.enum()` accepts enums directly | Zod 4.0 (2025) | Must use `z.enum()` for capability categories [VERIFIED: Context7] |
| Separate Remotion props interface + Zod schema | Single Zod schema with `z.infer<>` + Remotion `schema` prop | Remotion 4.0.426 | Schema is the single source of truth for both validation and types [VERIFIED: remotion.dev/docs/schemas] |
| `.Enum` / `.Values` on enum schemas | `.enum` property (lowercase) | Zod 4.0 | Accessing enum values changed API [VERIFIED: Context7] |
| Manual `delayRender` for data loading | Same pattern, no change | Current | `staticFile()` + `fetch()` + `delayRender()` remains the standard pattern [VERIFIED: Context7] |

**Deprecated/outdated:**
- `z.nativeEnum()`: Deprecated in Zod 4. Use `z.enum()` which now accepts TypeScript enums directly. [VERIFIED: Context7 /websites/zod_dev_v4]
- `.Enum` and `.Values` properties on enum schemas: Removed in Zod 4. Use `.enum` (lowercase). [VERIFIED: Context7 /websites/zod_dev_v4]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Zod `z.array().length(11)` enforces exactly 11 capability entries per tool | Code Examples | Would need `.min(11).max(11)` or a `.refine()` if `.length()` doesn't exist -- low risk, `.length()` is standard Zod API |
| A2 | `content/` directory at project root (not inside `src/`) is the best location for JSON data files | Architecture Patterns | If the planner prefers `src/content/data/`, the schema code still works -- directory layout is easily adjusted |
| A3 | Scene type components will be stub implementations (render a placeholder) during Phase 3, with full animation in Phase 2 | Architecture Patterns | If Phase 2 expects fully functional scene components from Phase 3, scope would expand significantly |
| A4 | The `sceneHints` field on capability entries is sufficient for CONT-04 content-to-scene mapping | Code Examples | If the mapping needs to be bidirectional or more granular (field-level, not entry-level), a separate mapping file may be needed |

## Open Questions

1. **Content location: `content/` vs `public/content/`**
   - What we know: Remotion's `staticFile()` resolves from `public/`. Tool/source JSON used for build-time validation could live anywhere. Lesson JSON consumed by Remotion at render time needs to be in `public/` or loaded via `calculateMetadata`.
   - What's unclear: Should tool/source JSON live in `content/` (project root) and lesson JSON in `public/lessons/`? Or should all content be in `public/content/`?
   - Recommendation: Place tool and source data in `content/` (project root, outside `public/`) since they're consumed at build-time by validation scripts and Phase 5's chatbot. Place lesson JSON in `public/lessons/` since Remotion needs `staticFile()` access. This separates "data layer" from "rendering assets."

2. **Scene component scope in Phase 3**
   - What we know: Phase 3 includes "animation architecture prep" (D-09) -- the dispatcher, schema, and loader. Phase 2 builds the actual animated scene components.
   - What's unclear: Should Phase 3 create stub/skeleton scene components for all 13 types, or just the dispatcher infrastructure that Phase 2 fills in?
   - Recommendation: Create the dispatcher with type-safe interfaces but only stub scene components (render a colored `<AbsoluteFill>` with the scene type name). Phase 2 implements the actual animations. This satisfies success criterion 6 (scene type dispatcher maps JSON scene types to Remotion components) without duplicating Phase 2 work.

3. **Vendor-to-tool mapping for sources**
   - What we know: D-07 says per-vendor source files align with Phase 4 scrapers. Some vendors produce multiple tools (OpenAI -> ChatGPT + Codex, Anthropic -> Claude + Claude Code + Cowork).
   - What's unclear: The exact vendor-to-tool mapping for source files.
   - Recommendation: Use the mapping: `openai.json` (ChatGPT, Codex), `anthropic.json` (Claude, Claude Code, Cowork), `google.json` (Gemini), `perplexity.json`, `xai.json` (Grok), `deepseek.json`, `alibaba.json` (Qwen), `comet.json`, `manus.json`. 9 vendor files for 12 tools.

## Project Constraints (from CLAUDE.md)

- **Container-first:** Docker from day 1. Content schemas should work in both host and container environments.
- **TDD approach:** Write tests before implementation. Schema tests before JSON population.
- **Official sources only:** All factual claims in tool JSON files must reference vendor docs -- no training data claims.
- **Brand compliance:** Syne font, warm linen palette, 4px radius -- scene components must follow brand tokens.
- **Teachable constraints:** Output is MP4 video (1080p, 30fps, <2GB). Content schemas must produce data that renders within these constraints.
- **Simplicity first (global CLAUDE.md):** Minimum code that solves the problem. No speculative abstractions.
- **Surgical changes (global CLAUDE.md):** Touch only what must be changed. Don't "improve" adjacent code.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All TypeScript/Zod code | Yes | v24.13.0 | -- |
| npm | Package management | Yes | 11.6.2 | -- |
| Zod | Schema validation | Yes | 4.3.6 (installed) | -- |
| Remotion | Video rendering | Yes | 4.0.460 | -- |
| Vitest | Testing | Yes | 4.1.6 | -- |
| TypeScript | Type checking | Yes | 6.0.3 | -- |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Tool JSON validates against Zod schema with all 11 categories | unit | `npx vitest run test/schemas/tool.test.ts -t "validates"` | Wave 0 |
| CONT-01 | Invalid tool JSON rejected with clear errors | unit | `npx vitest run test/schemas/tool.test.ts -t "rejects"` | Wave 0 |
| CONT-02 | Source bibliography validates (URL, title, ID) | unit | `npx vitest run test/schemas/source.test.ts` | Wave 0 |
| CONT-02 | Cross-reference: all sourceRefs in tools exist in sources | integration | `npx vitest run test/content/integrity.test.ts` | Wave 0 |
| CONT-03 | Content files exist in git and are valid JSON | smoke | `npx vitest run test/content/files.test.ts` | Wave 0 |
| CONT-04 | Capability entries have sceneHints mapping to valid scene types | unit | `npx vitest run test/schemas/scene-map.test.ts` | Wave 0 |
| CONT-05 | Lesson JSON validates against Zod schema | unit | `npx vitest run test/schemas/lesson.test.ts` | Wave 0 |
| CONT-05 | Scene timing constraints enforced (contiguous, no gaps) | unit | `npx vitest run test/schemas/lesson.test.ts -t "timing"` | Wave 0 |
| CONT-05 | Scene type dispatcher resolves all 13 types | unit | `npx vitest run test/content/dispatcher.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/schemas/tool.test.ts` -- covers CONT-01 (tool schema validation)
- [ ] `test/schemas/source.test.ts` -- covers CONT-02 (source schema validation)
- [ ] `test/schemas/lesson.test.ts` -- covers CONT-05 (lesson schema, timing constraints)
- [ ] `test/schemas/scene-map.test.ts` -- covers CONT-04 (scene mapping validation)
- [ ] `test/content/integrity.test.ts` -- covers CONT-02 (cross-reference integrity)
- [ ] `test/content/files.test.ts` -- covers CONT-03 (file existence, valid JSON)
- [ ] `test/content/dispatcher.test.ts` -- covers CONT-05 (scene type dispatcher)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A -- no user authentication in content repository |
| V3 Session Management | No | N/A -- no sessions |
| V4 Access Control | No | N/A -- content is public course material |
| V5 Input Validation | Yes | Zod schema validation on all JSON content before consumption |
| V6 Cryptography | No | N/A -- no secrets in content files |

### Known Threat Patterns for Content Repository

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed JSON injection via content files | Tampering | Zod schema validation with `safeParse()` before any consumption |
| Path traversal in staticFile() paths | Tampering | Remotion's `staticFile()` already restricts to `public/` directory |
| XSS via content strings rendered in React | Tampering | React's JSX escaping handles this by default; accent markup `*word*` is parsed, not injected as HTML |
| Source URL spoofing in bibliography | Spoofing | URL validation via `z.string().url()`; human review of source additions |

## Sources

### Primary (HIGH confidence)
- Context7 `/colinhacks/zod` - z.enum, z.object, z.discriminatedUnion, z.literal API
- Context7 `/websites/zod_dev_v4` - Zod 4 changelog, breaking changes, enum deprecation
- Context7 `/remotion-dev/remotion` - staticFile, delayRender, Sequence, Composition schema prop, calculateMetadata
- `05-content-schema.md` (project file) - Lesson JSON schema v1.0, timing constraints, versioning rules
- `03-scene-catalog.md` (project file) - 13 scene types with content schemas
- `04-component-api.md` (project file) - Component primitives, composition pattern
- `01-brand-system.md` (project file) - Brand tokens, typography scale, spacing
- `02-motion-contract.md` (project file) - Motion rules, easing, performance defaults
- npm registry - zod 4.4.3, remotion 4.0.460 (verified current versions)

### Secondary (MEDIUM confidence)
- [remotion.dev/docs/schemas](https://www.remotion.dev/docs/schemas) - Zod schema integration with Composition
- [remotion.dev/docs/zod-types](https://www.remotion.dev/docs/zod-types/) - @remotion/zod-types Zod 4 support since v4.0.426

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and verified against npm registry; Remotion+Zod 4 integration confirmed via official docs
- Architecture: HIGH - design system contracts (13 scene types, lesson schema) are locked and fully documented; Remotion patterns verified via Context7
- Pitfalls: HIGH - Zod 4 breaking changes verified against official changelog; Remotion staticFile behavior verified via Context7
- Content data model: HIGH - decisions D-01 through D-07 are locked; schema shapes follow directly from design system contracts

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (stable domain -- Zod and Remotion versions unlikely to break in 30 days)
