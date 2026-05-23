/**
 * Regeneration CLI (FRESH-01/02/03).
 *
 *   tsx scripts/regenerate.ts <lessonId> [--dry]
 *
 * Runs the lesson's content-hash DAG (plan → per-scene tts → align → render),
 * rebuilding only the artifacts whose inputs (or step version) changed. The
 * per-node cache lives at content/lessons/<id>/.regen-cache.json. Reports each
 * node as fresh / stale (rebuilt) / error. `--dry` reports what WOULD rebuild
 * without running any tool or writing the cache.
 *
 * NOTE: script generation is a Claude-passthrough step, not a DAG node — edit
 * script.json upstream, then run this to cascade the change downstream.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runDag, type CacheState, type NodeStatus } from '../src/lib/build-dag';
import { buildLessonNodes } from '../src/lib/regen-graph';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const LABEL: Record<NodeStatus, string> = {
  fresh: `${DIM}fresh${RESET}`,
  rebuilt: `${GREEN}stale → rebuilt${RESET}`,
  skipped: `${YELLOW}skipped (upstream failed)${RESET}`,
  error: `${RED}error${RESET}`,
};

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const lessonId = args.find((a) => !a.startsWith('--'));
  if (!lessonId) {
    console.error('usage: tsx scripts/regenerate.ts <lessonId> [--dry]');
    return 2;
  }

  const cachePath = join('content', 'lessons', lessonId, '.regen-cache.json');
  const cache: CacheState = existsSync(cachePath)
    ? JSON.parse(readFileSync(cachePath, 'utf-8'))
    : {};

  const nodes = buildLessonNodes(lessonId);
  console.log(`${BOLD}Regenerating ${lessonId}${RESET}${dryRun ? `${DIM} (dry run)${RESET}` : ''}\n`);

  const outcomes = await runDag(nodes, { cache, dryRun });

  for (const o of outcomes) {
    const detail = o.status === 'error' ? `${DIM} — ${o.error}${RESET}` : '';
    console.log(`  ${o.id.padEnd(12)} ${LABEL[o.status]}${detail}`);
  }

  if (!dryRun) writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);

  const rebuilt = outcomes.filter((o) => o.status === 'rebuilt').length;
  const fresh = outcomes.filter((o) => o.status === 'fresh').length;
  const errors = outcomes.filter((o) => o.status === 'error').length;
  const verb = dryRun ? 'would rebuild' : 'rebuilt';
  console.log(`\n${BOLD}${fresh} fresh · ${rebuilt} ${verb} · ${errors} error(s)${RESET}`);

  return errors > 0 ? 1 : 0;
}

main().then((code) => process.exit(code));
