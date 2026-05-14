# Phase 3 Audit: Content Repository & Schemas

**Audited:** 2026-05-14
**Auditor:** Claude (adversarial integrity audit)
**Methodology:** Read all 5 plan files, read all implementation files, ran all tests, ran validation CLI, cross-referenced exports/imports, compared against design catalog.

---

## Plan 03-01: Zod Schemas (capabilities, tool, source, scene-types, lesson)

### Claimed Features

- **CapabilityCategorySchema with 11 categories:** PRESENT -- Correct. 11 enum values match D-03 exactly.
- **CAPABILITY_CATEGORIES export:** PRESENT -- Derived from schema enum via `.options`.
- **CapabilityCategory type export:** PRESENT.
- **ToolSchema with all fields (id, name, vendor, priority, description, url, capabilities, sourceRefs):** PRESENT -- All fields present, capabilities uses `z.record(CapabilityCategorySchema, CapabilityEntrySchema)`.
- **CapabilityEntrySchema with subFeatures (min 1), limitations, pricingTiers, versionHistory:** PRESENT.
- **SubFeatureSchema with optional availableOn:** PRESENT.
- **VersionHistoryEntrySchema:** PRESENT.
- **Tool, CapabilityEntry, SubFeature, VersionHistoryEntry type exports:** PRESENT.
- **SourceEntrySchema (id, url, title only -- no verifiedAt per D-06):** PRESENT -- Confirmed no freshness fields.
- **SourceFileSchema (vendor, sources min 1):** PRESENT.
- **SourceFile, SourceEntry type exports:** PRESENT.
- **All 13 scene type content schemas from 03-scene-catalog.md:** PARTIAL -- The plan text says "13 scene types" but the catalog actually defines 14 types. The implementation correctly has 14 scene types and 14 content schemas. The plan's count of "13" was wrong; the implementation is right.
- **CoverContentSchema:** PRESENT -- matches catalog exactly.
- **JourneyMapContentSchema:** PRESENT -- matches catalog.
- **ComparisonChatsContentSchema:** PRESENT -- matches catalog.
- **ToolCardRevealContentSchema:** PRESENT -- matches catalog.
- **CapabilityTableContentSchema:** PRESENT -- cell enum B/Y/L/- matches catalog.
- **SetupChecklistContentSchema:** PRESENT -- matches catalog.
- **FeatureGridContentSchema:** PRESENT -- `n: z.string()` matches catalog ("01" is a string).
- **VoiceDemoContentSchema:** PRESENT -- matches catalog.
- **RecapGridContentSchema:** PRESENT -- with optional preview, matches catalog.
- **PreviewBandContentSchema:** PRESENT -- matches catalog.
- **DemoCueContentSchema:** PRESENT -- matches catalog.
- **DigDeeperContentSchema as z.object({}):** PRESENT -- catalog says it's not its own scene but the schema exists as empty object. Reasonable.
- **AssignmentListContentSchema with optional callout:** PRESENT -- matches catalog.
- **QuoteCardContentSchema:** PRESENT -- matches catalog.
- **SceneContentSchema export (discriminated union or lookup function):** PARTIAL -- Plan artifact claims `exports: ["SceneContentSchema", "SCENE_TYPES"]`, but the actual exports are `SCENE_CONTENT_SCHEMAS` (a record) and `getContentSchema()` (a lookup function). The named export `SceneContentSchema` does not exist. The plan text says "or export a getContentSchema lookup function" which was followed, but the artifact metadata is wrong.
- **SCENE_TYPES export:** PRESENT.
- **SceneTypeSchema export:** PRESENT.
- **LessonMetaSchema (createdAt, lastUpdated, authors, factCheckedAt nullable):** PRESENT.
- **LessonInfoSchema (title, topic, module, duration, brandLabel optional):** PARTIAL -- Plan says `brandLabel: z.string().optional().default("Sample Academy")` but implementation uses only `.optional()` with no `.default()`. This means omitting `brandLabel` yields `undefined` instead of `"Sample Academy"`.
- **SceneBaseSchema (id, type, start, duration, label optional, content record):** PRESENT.
- **LessonSchema with schemaVersion "1.0" literal, superRefine timing constraints:** PRESENT -- All 3 timing checks implemented (start=0, contiguous, duration match).
- **Lesson, SceneBase, LessonMeta, LessonInfo type exports:** PRESENT.
- **Barrel export index.ts:** PRESENT -- Re-exports all 5 schema modules.

### Test Coverage

- **CapabilityCategorySchema accepts/rejects:** TESTED (3 tests)
- **ToolSchema accepts/rejects:** TESTED (4 tests including missing id, invalid priority, invalid URL)
- **CapabilityEntrySchema subFeatures min, full entry, invalid category:** TESTED (3 tests)
- **SourceFileSchema accepts/rejects/empty:** TESTED (3 tests)
- **SceneTypeSchema accepts/rejects:** TESTED (2 tests)
- **CoverContentSchema with stats:** TESTED (1 test)
- **CapabilityTableContentSchema cell validation:** TESTED (1 test)
- **QuoteCardContentSchema:** TESTED (1 test)
- **LessonSchema timing constraints:** TESTED (4 tests: start!=0, gap, duration mismatch, wrong version)
- **LessonSchema empty object rejection:** TESTED (1 test)
- **SCENE_TYPES count assertion:** TESTED -- but see WARNING below
- **JourneyMapContentSchema:** UNTESTED
- **ComparisonChatsContentSchema:** UNTESTED
- **ToolCardRevealContentSchema:** UNTESTED
- **SetupChecklistContentSchema:** UNTESTED
- **FeatureGridContentSchema:** UNTESTED
- **VoiceDemoContentSchema:** UNTESTED
- **RecapGridContentSchema:** UNTESTED
- **PreviewBandContentSchema:** UNTESTED
- **DemoCueContentSchema:** UNTESTED
- **DigDeeperContentSchema:** UNTESTED
- **AssignmentListContentSchema:** UNTESTED
- **getContentSchema/SCENE_CONTENT_SCHEMAS:** UNTESTED -- The lookup function and schema map are never tested

### Connection Integrity

- **tool.ts -> capabilities.ts (imports CapabilityCategorySchema):** CONNECTED -- Line 2.
- **lesson.ts -> scene-types.ts (imports SceneTypeSchema):** CONNECTED -- Line 2.
- **index.ts re-exports all 5 modules:** CONNECTED.

### Orphans

- **getContentSchema() and SCENE_CONTENT_SCHEMAS:** These are exported from `content/schemas/scene-types.ts` but never imported or used anywhere in the codebase. They are dead code today. No consumer validates per-scene content against the type-specific schema.

---

## Plan 03-02: Scene Dispatcher, Content Loader, Scene Type System

### Claimed Features

- **src/lib/scene-types.ts with SCENE_TYPES (14 entries):** PRESENT.
- **SceneType union type:** PRESENT.
- **SceneComponentProps interface:** PRESENT -- Matches plan specification exactly.
- **SceneComponentFactory type (React.FC<SceneComponentProps>):** PRESENT.
- **SceneRegistry type (Partial<Record<SceneType, SceneComponentFactory>>):** PRESENT.
- **SCENE_TYPE_REGISTRY export:** MISSING -- Plan artifact says `exports: ["SceneType", "SCENE_TYPE_REGISTRY", "SceneComponentProps"]` but `SCENE_TYPE_REGISTRY` is not exported. The export is `SceneRegistry` (a type), not `SCENE_TYPE_REGISTRY` (a const). This is a naming discrepancy vs the plan.
- **registerSceneComponent (throws on duplicate):** PRESENT.
- **getSceneComponent (returns null for unknown):** PRESENT.
- **getRegisteredTypes:** PRESENT.
- **clearRegistry:** PRESENT.
- **loadLesson (async, reads file, validates against LessonSchema, throws on failure):** PRESENT -- Uses `readFileSync` inside `async` function (plan says sync is fine for build time).
- **loadToolData (async, validates against ToolSchema):** PRESENT.
- **loadSourceFile (async, validates against SourceFileSchema):** PRESENT.
- **validateLesson (non-throwing, returns success/errors):** PRESENT.
- **validateToolData (non-throwing, returns success/errors):** PRESENT.
- **validateSourceFile (non-throwing variant):** MISSING -- Plan does not explicitly require this, but the pattern is established for the other two. `loadSourceFile` exists but there is no `validateSourceFile`.

### Test Coverage

- **SCENE_TYPES count:** TESTED -- Asserts 14 (correct, matches implementation).
- **SCENE_TYPES includes specific types:** TESTED (cover, journey-map, quote-card).
- **registerSceneComponent + getSceneComponent round-trip:** TESTED.
- **getSceneComponent returns null for unregistered:** TESTED.
- **getSceneComponent returns null for invalid type:** TESTED.
- **registerSceneComponent throws on duplicate:** TESTED.
- **getRegisteredTypes empty/populated:** TESTED (2 tests).
- **clearRegistry used in beforeEach:** TESTED (prevents state leakage).
- **validateLesson empty object:** TESTED.
- **validateLesson wrong schemaVersion:** TESTED.
- **validateLesson valid minimal lesson:** TESTED.
- **validateLesson timing gap:** TESTED.
- **validateToolData empty object:** TESTED.
- **validateToolData valid tool:** TESTED.
- **loadLesson (async file reading):** UNTESTED -- Only the synchronous validate variant is tested.
- **loadToolData (async file reading):** UNTESTED.
- **loadSourceFile (async file reading):** UNTESTED.
- **Error message formatting in load functions:** UNTESTED.

### Connection Integrity

- **scene-dispatcher.ts -> scene-types.ts (imports SceneType, SceneComponentFactory, SceneRegistry, SCENE_TYPES):** CONNECTED.
- **content-loader.ts -> content/schemas/index.ts (imports LessonSchema, ToolSchema, SourceFileSchema):** CONNECTED.
- **scene-dispatcher.ts -> any actual Remotion component:** NOT CONNECTED -- Expected: Plan says this happens in Phase 2. The dispatcher is empty infrastructure with no registrations. This is by design.
- **content-loader.ts -> any actual lesson JSON:** NOT CONNECTED in production code -- Only connected via tests (content-validation.test.ts uses the validation functions indirectly).

### Orphans

- **Duplicate SCENE_TYPES definition:** Both `content/schemas/scene-types.ts` and `src/lib/scene-types.ts` independently define the same `SCENE_TYPES` array. They are currently identical (14 items, same order). Neither imports from the other. If one is updated without the other, they will silently drift apart with no compile-time or test-time error. This is a maintenance hazard.
- **src/lib/scene-types.ts imports React** but no other file in src/lib/ uses React component types except through the dispatcher. This is fine -- it's needed for `React.FC`.

---

## Plan 03-03: P0 LLM Tool Data (ChatGPT, Claude, Gemini, Perplexity) + Source Bibliographies

### Claimed Features

- **content/tools/chatgpt.json with 11 capabilities:** PRESENT -- All 11 categories, real data, P0 priority.
- **content/tools/claude.json with 11 capabilities:** PRESENT -- All 11 categories, real data, P0 priority.
- **content/tools/gemini.json with 11 capabilities:** PRESENT -- All 11 categories, real data, P0 priority.
- **content/tools/perplexity.json with 11 capabilities:** PRESENT -- All 11 categories, P0 priority, unsupported capabilities marked with `supported: false`.
- **content/sources/openai.json (8+ entries):** PRESENT -- 12 entries.
- **content/sources/anthropic.json (8+ entries):** PRESENT -- 10 entries.
- **content/sources/google.json (8+ entries):** PRESENT -- 10 entries.
- **content/sources/perplexity.json (6+ entries):** PRESENT -- 8 entries.
- **All tool sourceRefs point to valid source IDs:** PRESENT -- Cross-reference validation passes.
- **All files pass ToolSchema/SourceFileSchema validation:** PRESENT -- Confirmed by validation CLI and tests.
- **Every capability entry has subFeatures (min 1), limitations, pricingTiers, versionHistory:** PRESENT -- No empty arrays found in any tool.

### Test Coverage

- **chatgpt.json validates against ToolSchema:** TESTED (content-validation.test.ts).
- **claude.json validates against ToolSchema:** TESTED.
- **gemini.json validates against ToolSchema:** TESTED.
- **perplexity.json validates against ToolSchema:** TESTED.
- **All 4 have 11 capability keys:** TESTED.
- **sourceRefs cross-reference for all 4:** TESTED.
- **All 4 source files validate against SourceFileSchema:** TESTED.
- **Data accuracy (factual correctness of capability descriptions):** UNTESTED -- This cannot be automated. No spot-check evidence in planning docs.

### Connection Integrity

- **chatgpt.json sourceRefs -> openai.json source IDs:** CONNECTED -- 11 refs, all resolve.
- **claude.json sourceRefs -> anthropic.json source IDs:** CONNECTED -- 10 refs, all resolve.
- **gemini.json sourceRefs -> google.json source IDs:** CONNECTED -- 10 refs, all resolve.
- **perplexity.json sourceRefs -> perplexity.json source IDs:** CONNECTED -- 8 refs, all resolve.

### Orphans

- None found for this plan.

---

## Plan 03-04: Remaining Tools (P0 Coding Agents + P1 Tools) + Source Bibliographies

### Claimed Features

- **content/tools/codex.json (P0, 11 caps):** PRESENT.
- **content/tools/claude-code.json (P0, 11 caps):** PRESENT.
- **content/tools/cowork.json (P0, 11 caps):** PRESENT.
- **content/tools/grok.json (P1, 11 caps):** PRESENT.
- **content/tools/deepseek.json (P1, 11 caps):** PRESENT.
- **content/tools/qwen.json (P1, 11 caps):** PRESENT.
- **content/tools/comet.json (P1, 11 caps):** PRESENT.
- **content/tools/manus.json (P1, 11 caps):** PRESENT.
- **content/sources/openai-codex.json:** PRESENT -- 5 entries.
- **content/sources/anthropic-code.json:** PRESENT -- 8 entries (covers both Claude Code and Cowork).
- **content/sources/xai.json:** PRESENT -- 5 entries.
- **content/sources/deepseek.json:** PRESENT -- 5 entries.
- **content/sources/alibaba.json:** PRESENT -- 5 entries.
- **content/sources/comet.json:** PRESENT -- 3 entries.
- **content/sources/manus.json:** PRESENT -- 3 entries.
- **All 8 tool files pass ToolSchema validation:** PRESENT.
- **All source files pass SourceFileSchema validation:** PRESENT.
- **Combined with 03-03, all 12 tools populated:** PRESENT -- 12/12 confirmed.

### Test Coverage

- **All 8 tool files validate against ToolSchema:** TESTED (content-validation.test.ts).
- **All 8 have 11 capability keys:** TESTED.
- **sourceRefs cross-reference for all 8:** TESTED.
- **All 7 source files validate against SourceFileSchema:** TESTED (alibaba, anthropic-code, xai, deepseek, comet, manus, openai-codex).
- **Data accuracy:** UNTESTED (same as 03-03).

### Connection Integrity

- **codex.json sourceRefs -> openai-codex.json:** CONNECTED -- 5 refs, all resolve.
- **claude-code.json sourceRefs -> anthropic-code.json:** CONNECTED -- 6 refs, all resolve.
- **cowork.json sourceRefs -> anthropic-code.json:** CONNECTED -- 3 refs (cowork-announcement, cowork-docs, claude-code-pricing), all resolve.
- **grok.json sourceRefs -> xai.json:** CONNECTED -- 5 refs, all resolve.
- **deepseek.json sourceRefs -> deepseek.json (sources):** CONNECTED -- 5 refs, all resolve.
- **qwen.json sourceRefs -> alibaba.json:** CONNECTED -- 5 refs, all resolve.
- **comet.json sourceRefs -> comet.json (sources):** CONNECTED -- 3 refs, all resolve.
- **manus.json sourceRefs -> manus.json (sources):** CONNECTED -- 3 refs, all resolve.

### Orphans

- None found for this plan.

---

## Plan 03-05: Content-to-Scene Mapping, Validation CLI, Integration Tests

### Claimed Features

- **content/mappings/scene-content-map.ts with ContentSceneMapping interface:** PRESENT.
- **CONTENT_SCENE_MAPPINGS array (7 mapping entries):** PRESENT -- 7 entries mapping capabilities, tool meta, and sources to scene types.
- **getAffectedScenes(toolId, changedPaths):** PRESENT -- Uses prefix/wildcard matching. Note: `toolId` parameter is accepted but UNUSED (prefixed with `_`). The function ignores which tool changed; it only looks at paths.
- **getToolsAffectingScene(sceneType):** PRESENT -- Returns contentPath values (not tool IDs as the function name might suggest).
- **scripts/validate-content.ts CLI:** PRESENT -- Validates all tool files, all source files, cross-references sourceRefs. ANSI colored output. Exit code 0/1.
- **validate:content npm script:** PRESENT -- `"validate:content": "tsx scripts/validate-content.ts"` in package.json.
- **test/content-validation.test.ts integration tests:** PRESENT -- 56 tests covering tool validation, source validation, cross-reference, and mapping functions.

### Test Coverage

- **12 tool files validated against ToolSchema:** TESTED.
- **12 tool files have 11 capability keys each:** TESTED.
- **11 source files validated against SourceFileSchema:** TESTED.
- **12 tool cross-references verified:** TESTED.
- **getAffectedScenes("chatgpt", ["capabilities.writing-chat"]) includes comparison-chats:** TESTED.
- **getAffectedScenes("chatgpt", ["name"]) includes tool-card-reveal:** TESTED.
- **getAffectedScenes("chatgpt", ["capabilities.dictation"]) includes voice-demo:** TESTED.
- **getAffectedScenes wildcard matching (capability-table, feature-grid from capabilities.*):** TESTED.
- **getAffectedScenes("chatgpt", ["description"]) includes comparison-chats and capability-table:** TESTED.
- **getToolsAffectingScene("capability-table") returns non-empty:** TESTED.
- **getToolsAffectingScene("voice-demo") includes capabilities.dictation:** TESTED.
- **getToolsAffectingScene("setup-checklist") includes capabilities:** TESTED.
- **Exactly 12 tool files exist:** TESTED.
- **Validation CLI itself (scripts/validate-content.ts):** UNTESTED as a unit -- Only tested indirectly via running it manually. No test asserts the CLI exit code or output.

### Connection Integrity

- **scene-content-map.ts -> content/schemas/scene-types.ts (imports SceneType):** CONNECTED -- Line 1.
- **scripts/validate-content.ts -> content/schemas/tool.ts, source.ts:** CONNECTED -- Lines 3-4.
- **test/content-validation.test.ts -> content/mappings/scene-content-map.ts:** CONNECTED.
- **test/content-validation.test.ts -> content/schemas/tool.ts, source.ts, capabilities.ts:** CONNECTED.

### Orphans

- **getAffectedScenes `toolId` parameter:** The function accepts `toolId: string` but ignores it (parameter renamed to `_toolId`). The function only operates on `changedPaths`. This means calling `getAffectedScenes("chatgpt", [...])` and `getAffectedScenes("gemini", [...])` with the same paths returns identical results. The plan says "Given a tool ID and a list of changed content paths, return deduplicated scene types" but the tool ID is not used in any logic. Either the parameter should be removed, or per-tool mapping logic should exist.
- **getToolsAffectingScene misleading name:** This function returns `contentPath` strings (like "capabilities.*", "name", "description"), not tool IDs. The function name suggests it returns tool identifiers, but it returns mapping path patterns. This is confusing for consumers.

---

## Cross-Cutting Issues

### WARNING: Duplicate SCENE_TYPES Definition (Drift Risk)

Both `content/schemas/scene-types.ts` (line 3) and `src/lib/scene-types.ts` (line 3) independently define the `SCENE_TYPES` array with the same 14 values. Neither file imports from the other. If a scene type is added or removed from one file but not the other, the system will silently have inconsistent definitions. The `content/schemas/` version is used by Zod validation; the `src/lib/` version is used by the dispatcher. A mismatch would mean content could validate against a scene type the dispatcher doesn't know about, or vice versa.

### WARNING: Per-Scene Content Not Validated Against Type-Specific Schemas

The `LessonSchema` validates scenes with `content: z.record(z.string(), z.unknown())`. This means a `type: "cover"` scene could have completely wrong content (e.g., missing `eyebrow`, `title`, `sub`) and still pass lesson validation. The individual content schemas (`CoverContentSchema`, `JourneyMapContentSchema`, etc.) exist but are never wired into `LessonSchema` validation. The `SCENE_CONTENT_SCHEMAS` record and `getContentSchema()` function exist but have zero consumers anywhere in the codebase.

### WARNING: Misleading Test Assertion -- "13 scene types"

In `test/schemas.test.ts` line 164, the test description says "has exactly 13 scene type entries" but the assertion checks `toHaveLength(14)`. The test passes because the assertion is correct (14), but the description is wrong. This was noted in the verification doc as "a count error in the plan header text."

### INFO: Missing Summary Files

Plan 03-01 and 03-02 do not have corresponding `*-SUMMARY.md` files. Plans 03-03, 03-04, and 03-05 have summaries. The plans say "After completion, create SUMMARY.md" for all five, but two are missing.

### INFO: `loadSourceFile` Has No Non-Throwing Variant

`loadLesson` has `validateLesson`, `loadToolData` has `validateToolData`, but `loadSourceFile` has no corresponding `validateSourceFile`. The pattern is inconsistent.

### INFO: async Functions Using readFileSync

`loadLesson`, `loadToolData`, and `loadSourceFile` are all `async` functions that internally use `fs.readFileSync` (synchronous). The plan notes "sync is fine -- this runs at build time, not render time" which is defensible. But the async wrapper is misleading -- callers will `await` them for no reason. These could just be synchronous functions.

---

## Summary

| Metric | Count |
|--------|-------|
| **Total claimed features (across all 5 plans)** | 68 |
| **Present and working** | 63 |
| **Partial (works but deviates from plan)** | 3 |
| **Missing** | 2 |
| **Test files** | 3 (schemas.test.ts, scene-dispatcher.test.ts, content-validation.test.ts) |
| **Total test cases** | 95 (25 + 14 + 56) |
| **All tests passing** | Yes |
| **TypeScript compiles clean** | Yes |
| **Validation CLI passes** | Yes (35/35) |
| **Orphan structures found** | 4 |

### Partial Features (3)

1. `SceneContentSchema` export -- Plan artifact claims this name, actual exports are `SCENE_CONTENT_SCHEMAS` and `getContentSchema()`.
2. `SCENE_TYPE_REGISTRY` export -- Plan artifact claims this, actual export is `SceneRegistry` (a type, not a const).
3. `LessonInfoSchema.brandLabel` -- Plan says `.default("Sample Academy")`, implementation has `.optional()` only (no default).

### Missing Features (2)

1. `03-01-SUMMARY.md` -- Plan output section says to create it. Does not exist.
2. `03-02-SUMMARY.md` -- Plan output section says to create it. Does not exist.

### Orphans (4)

1. `getContentSchema()` and `SCENE_CONTENT_SCHEMAS` -- Exported but never imported anywhere.
2. Duplicate `SCENE_TYPES` array in two files with no shared source of truth.
3. `getAffectedScenes` `toolId` parameter -- Accepted but unused.
4. `getToolsAffectingScene` returns content paths, not tool IDs, despite its name.

### Untested Components

| Component | Status |
|-----------|--------|
| loadLesson (async file reader) | UNTESTED |
| loadToolData (async file reader) | UNTESTED |
| loadSourceFile (async file reader) | UNTESTED |
| getContentSchema / SCENE_CONTENT_SCHEMAS | UNTESTED |
| 10 of 14 individual scene content schemas | UNTESTED (only Cover, CapabilityTable, QuoteCard tested) |
| Validation CLI exit code behavior | UNTESTED |
| Data accuracy of tool capabilities | UNTESTED (not automatable) |

### Test Coverage Estimate

Of the ~30 distinct testable components/functions, 19 have at least one test (some have many). That puts test coverage at roughly **63% of testable components**. The async file loaders, most scene content schemas, and the content-schema-to-scene-type lookup are the primary gaps.

### Overall Assessment

Phase 3 is **substantially complete and functional**. The core deliverables work: schemas validate, tool data is real and structured, cross-references resolve, the validation CLI works, tests pass. The main concerns are:

1. **The scene content schemas exist but are never used** -- this is the biggest structural gap. Lesson content is validated as `Record<string, unknown>` regardless of scene type, making the 14 individual content schemas dead code.
2. **Duplicate SCENE_TYPES** across two files is a maintenance time bomb.
3. **Missing summaries** for Plans 01 and 02 are documentation gaps, not functional issues.
4. The `brandLabel` default value discrepancy is minor but could cause unexpected `undefined` values downstream.

The verification report (03-VERIFICATION.md) rated this 6/6 with "No gaps found." That assessment is **overly generous** -- it did not catch the dead content schemas, the duplicate SCENE_TYPES, the misleading test description, or the unused `toolId` parameter.
