import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { OutlineSchema } from '../content/schemas/outline';
import { ScriptSchema } from '../content/schemas/script';
import { buildGroundingContext } from '../src/lib/grounding';
import { buildScriptPrompt } from '../src/lib/script-prompt';
import { factCheckScript } from '../src/lib/fact-check';

/**
 * Script generation CLI (SCRIPT-01 / SCRIPT-02).
 *
 *   tsx scripts/generate-script.ts <lessonId>            # write the generation prompt for Claude
 *   tsx scripts/generate-script.ts <lessonId> --check    # validate + fact-check an existing script.json
 *
 * Following the project's Claude Code passthrough design (D-02 / ingest:llm), the prompt is written
 * to disk for Claude to fill — no paid API call. The --check pass validates the produced script.json
 * against the schema and the grounding fact-check gate before it can flow downstream.
 */

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const root = join(import.meta.dirname!, '..');
const lessonId = process.argv[2];
const checkMode = process.argv.includes('--check');

if (!lessonId) {
  console.error('Usage: tsx scripts/generate-script.ts <lessonId> [--check]');
  process.exit(1);
}

const lessonDir = join(root, 'content', 'lessons', lessonId);
const outlinePath = join(lessonDir, 'outline.json');
const scriptPath = join(lessonDir, 'script.json');
const promptPath = join(lessonDir, '.script-prompt.txt');

if (!existsSync(outlinePath)) {
  console.error(`${RED}No outline at ${outlinePath}${RESET}`);
  process.exit(1);
}

const outline = OutlineSchema.parse(JSON.parse(readFileSync(outlinePath, 'utf-8')));
const grounding = buildGroundingContext(outline);

if (!checkMode) {
  const styleGuide = readFileSync(join(root, 'content', 'teaching', 'STYLE.md'), 'utf-8');
  const prompt = buildScriptPrompt(outline, styleGuide, grounding);
  mkdirSync(lessonDir, { recursive: true });
  writeFileSync(promptPath, prompt, 'utf-8');
  console.log(`${BOLD}Script prompt written:${RESET} ${promptPath}`);
  console.log(`Grounded with ${Object.keys(grounding.tools).length} tools, ${Object.keys(grounding.capabilities).length} capabilities.`);
  console.log(`Have Claude produce ${scriptPath} (ScriptSchema JSON), then run with --check.`);
  process.exit(0);
}

// --- check mode ---
if (!existsSync(scriptPath)) {
  console.error(`${RED}No script at ${scriptPath} — generate it first (run without --check).${RESET}`);
  process.exit(1);
}

const parsed = ScriptSchema.safeParse(JSON.parse(readFileSync(scriptPath, 'utf-8')));
if (!parsed.success) {
  console.error(`${RED}script.json failed schema validation:${RESET}`);
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

const result = factCheckScript(parsed.data, grounding);
console.log(`${BOLD}Fact-check:${RESET} ${parsed.data.blocks.length} blocks, ${result.verifiedRefs} refs verified`);
for (const n of result.notes) console.log(`  ${YELLOW}note${RESET}  [${n.blockId}] ${n.note}`);
for (const f of result.flags) console.error(`  ${RED}FLAG${RESET}  [${f.blockId}] ${f.ref}: ${f.reason}`);

if (!result.ok) {
  console.error(`\n${RED}Fact-check FAILED — ${result.flags.length} unverifiable claim(s). Pipeline blocked.${RESET}`);
  process.exit(1);
}
console.log(`\n${GREEN}Script valid and fully grounded.${RESET}`);
