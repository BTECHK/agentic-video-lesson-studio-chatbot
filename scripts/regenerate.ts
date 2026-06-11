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
import { type CacheState, type NodeStatus } from '../src/lib/build-dag';
import { runLessonRegen } from '../src/lib/regen-graph';
import { runMain, type Logger } from '../src/lib/logger';

const STATUS_LEVEL: Record<NodeStatus, 'info' | 'warn' | 'error'> = {
  fresh: 'info',
  rebuilt: 'info',
  skipped: 'warn',
  error: 'error',
};

async function main(log: Logger): Promise<number> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const lessonId = args.find((a) => !a.startsWith('--'));
  if (!lessonId) {
    log.error('usage: tsx scripts/regenerate.ts <lessonId> [--dry]');
    return 2;
  }

  const cachePath = join('content', 'lessons', lessonId, '.regen-cache.json');
  const cache: CacheState = existsSync(cachePath)
    ? JSON.parse(readFileSync(cachePath, 'utf-8'))
    : {};

  log.info('regenerating lesson', { lessonId, dryRun });

  // Two-pass: plan runs first, then the node set is built from the freshly-
  // planned lesson.json (fixes stale-tts + scene-set-change staleness).
  const outcomes = await runLessonRegen(lessonId, { cache, dryRun });

  for (const o of outcomes) {
    log[STATUS_LEVEL[o.status]](`node ${o.status}`, { id: o.id, status: o.status, ...(o.error ? { error: o.error } : {}) });
  }

  if (!dryRun) writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);

  const rebuilt = outcomes.filter((o) => o.status === 'rebuilt').length;
  const fresh = outcomes.filter((o) => o.status === 'fresh').length;
  const errors = outcomes.filter((o) => o.status === 'error').length;
  log.info('regeneration summary', { fresh, rebuilt, errors, dryRun, verb: dryRun ? 'would-rebuild' : 'rebuilt' });

  return errors > 0 ? 1 : 0;
}

runMain('regen', main);
