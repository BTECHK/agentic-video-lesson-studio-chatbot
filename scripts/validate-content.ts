import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { ToolSchema, validateProductInvariant, type Tool } from '../content/schemas/tool';
import { SourceFileSchema } from '../content/schemas/source';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const toolsDir = join(import.meta.dirname!, '..', 'content', 'tools');
const sourcesDir = join(import.meta.dirname!, '..', 'content', 'sources');

let passed = 0;
let failed = 0;
const errors: string[] = [];

// --- Validate tool files ---
console.log(`${BOLD}Validating tool files...${RESET}\n`);

const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.json'));
const parsedTools: Tool[] = [];

for (const file of toolFiles) {
  const filePath = join(toolsDir, file);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = ToolSchema.safeParse(raw);

  if (result.success) {
    console.log(`  ${GREEN}PASS${RESET}  ${file}`);
    parsedTools.push(result.data);
    passed++;
  } else {
    console.log(`  ${RED}FAIL${RESET}  ${file}`);
    const issues = result.error.issues.map(
      (i) => `    - ${i.path.join('.')}: ${i.message}`,
    );
    errors.push(`${file}:\n${issues.join('\n')}`);
    failed++;
  }
}

// --- Validate product taxonomy invariant ---
console.log(`\n${BOLD}Validating product taxonomy...${RESET}\n`);

const invariantErrors = validateProductInvariant(parsedTools);
if (invariantErrors.length === 0) {
  console.log(`  ${GREEN}PASS${RESET}  every product has exactly one primary surface`);
  passed++;
} else {
  for (const e of invariantErrors) {
    console.log(`  ${RED}FAIL${RESET}  ${e}`);
    errors.push(e);
    failed++;
  }
}

// --- Validate source files ---
console.log(`\n${BOLD}Validating source files...${RESET}\n`);

const sourceFiles = readdirSync(sourcesDir).filter((f) => f.endsWith('.json'));

// Build source ID set for cross-reference checking
const allSourceIds = new Set<string>();

for (const file of sourceFiles) {
  const filePath = join(sourcesDir, file);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = SourceFileSchema.safeParse(raw);

  if (result.success) {
    console.log(`  ${GREEN}PASS${RESET}  ${file}`);
    for (const s of result.data.sources) {
      allSourceIds.add(s.id);
    }
    passed++;
  } else {
    console.log(`  ${RED}FAIL${RESET}  ${file}`);
    const issues = result.error.issues.map(
      (i) => `    - ${i.path.join('.')}: ${i.message}`,
    );
    errors.push(`${file}:\n${issues.join('\n')}`);
    failed++;
  }
}

// --- Cross-reference: tool sourceRefs -> source IDs ---
console.log(`\n${BOLD}Cross-referencing sourceRefs...${RESET}\n`);

for (const file of toolFiles) {
  const filePath = join(toolsDir, file);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const toolName = basename(file, '.json');
  const sourceRefs: string[] = raw.sourceRefs ?? [];
  const missing = sourceRefs.filter((ref) => !allSourceIds.has(ref));

  if (missing.length === 0) {
    console.log(`  ${GREEN}PASS${RESET}  ${toolName}: all ${sourceRefs.length} refs found`);
    passed++;
  } else {
    console.log(
      `  ${YELLOW}WARN${RESET}  ${toolName}: missing refs: ${missing.join(', ')}`,
    );
    errors.push(`${toolName} cross-ref: missing source IDs: ${missing.join(', ')}`);
    failed++;
  }
}

// --- Summary ---
console.log(`\n${BOLD}Summary${RESET}`);
console.log(`  Passed: ${GREEN}${passed}${RESET}`);
console.log(`  Failed: ${RED}${failed}${RESET}`);

if (errors.length > 0) {
  console.log(`\n${RED}${BOLD}Errors:${RESET}`);
  for (const err of errors) {
    console.log(`\n  ${err}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
