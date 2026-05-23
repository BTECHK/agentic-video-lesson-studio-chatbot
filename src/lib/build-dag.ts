/**
 * Content-hash regeneration DAG (FRESH-01/02/03).
 *
 * Each artifact is a node `{ id, deps, inputs, output, version, run }`. A node's
 * cache key is the SHA-256 of its step version plus the hashes of its inputs —
 * CONTENT, never mtime, because the artifacts live on Docker/WSL2 mounts where
 * mtimes are unreliable. Re-running a node is skipped when its cache key is
 * unchanged and its output still exists; otherwise it rebuilds and the change
 * cascades to dependents (their inputs include the rebuilt output's content).
 *
 * The engine is pure orchestration: `inputs()` and `run()` are supplied by the
 * caller, so it is exercised in tests with an in-memory store and no real tools.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';

export type NodeStatus = 'fresh' | 'rebuilt' | 'skipped' | 'error';

export interface DagNode {
  /** Unique node id (also the cache key under which its hash is stored). */
  id: string;
  /** Ids of nodes that must run before this one (defines build order). */
  deps: string[];
  /**
   * Content strings whose hashes form this node's cache key. Read LAZILY at run
   * time so a node sees its dependencies' freshly-rebuilt outputs. Per-scene
   * nodes return only their own slice (e.g. one scene's narration) so editing
   * one scene does not invalidate the others.
   */
  inputs: () => string[];
  /** Output path; its existence is required for a cached node to count as fresh. */
  output: string;
  /** Bump to force a rebuild when the step's LOGIC changes (not its inputs). */
  version: number;
  /** Performs the actual rebuild (shell out to a script/tool, write `output`). */
  run: () => Promise<void>;
}

export interface NodeOutcome {
  id: string;
  status: NodeStatus;
  key: string;
  error?: string;
}

/** Persisted cache: node id → last-built cache key. */
export type CacheState = Record<string, string>;

export interface RunOptions {
  cache: CacheState;
  /** Report what would rebuild without running anything or touching the cache. */
  dryRun?: boolean;
  /** Output-existence check; injectable for tests. Defaults to fs.existsSync. */
  outputExists?: (path: string) => boolean;
}

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

/** SHA-256 of the step version plus each input's hash. Newline-delimited; inputs
 *  are fixed-length hex digests so boundaries can't shift (['a','b'] ≠ ['ab','']). */
export function cacheKey(node: DagNode): string {
  return sha256([`v${node.version}`, ...node.inputs().map(sha256)].join('\n'));
}

/** Depth-first topological sort; throws on cycles or unknown dependencies. */
export function topoSort(nodes: DagNode[]): DagNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ordered: DagNode[] = [];
  const done = new Set<string>();
  const onStack = new Set<string>();

  const visit = (n: DagNode): void => {
    if (done.has(n.id)) return;
    if (onStack.has(n.id)) throw new Error(`Dependency cycle through "${n.id}"`);
    onStack.add(n.id);
    for (const depId of n.deps) {
      const dep = byId.get(depId);
      if (!dep) throw new Error(`Node "${n.id}" depends on unknown node "${depId}"`);
      visit(dep);
    }
    onStack.delete(n.id);
    done.add(n.id);
    ordered.push(n);
  };

  for (const n of nodes) visit(n);
  return ordered;
}

/**
 * Run the DAG in dependency order. Mutates `cache` in place as nodes rebuild
 * (the caller persists it). A node whose dependency failed is skipped, and the
 * skip propagates so we never run a step on stale inputs.
 */
export async function runDag(nodes: DagNode[], opts: RunOptions): Promise<NodeOutcome[]> {
  const exists = opts.outputExists ?? existsSync;
  const ordered = topoSort(nodes);
  const failed = new Set<string>();
  const outcomes: NodeOutcome[] = [];

  for (const node of ordered) {
    if (node.deps.some((d) => failed.has(d))) {
      failed.add(node.id);
      outcomes.push({ id: node.id, status: 'skipped', key: '' });
      continue;
    }

    const key = cacheKey(node);
    if (opts.cache[node.id] === key && exists(node.output)) {
      outcomes.push({ id: node.id, status: 'fresh', key });
      continue;
    }

    if (opts.dryRun) {
      outcomes.push({ id: node.id, status: 'rebuilt', key });
      continue;
    }

    try {
      await node.run();
      opts.cache[node.id] = key;
      outcomes.push({ id: node.id, status: 'rebuilt', key });
    } catch (err) {
      delete opts.cache[node.id]; // invalidate so the next run retries this node
      failed.add(node.id);
      outcomes.push({ id: node.id, status: 'error', key, error: (err as Error).message });
    }
  }

  return outcomes;
}
