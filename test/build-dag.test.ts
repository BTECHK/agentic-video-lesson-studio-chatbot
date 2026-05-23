import { describe, it, expect } from 'vitest';
import { cacheKey, topoSort, runDag, type DagNode, type CacheState } from '../src/lib/build-dag';

/**
 * In-memory artifact store: a node's run() writes to it, a node's inputs()/
 * output existence read from it. Lets us test the full content-hash cascade
 * without touching the filesystem or any external tool.
 */
function makeStore() {
  const store = new Map<string, string>();
  const log: string[] = [];
  return { store, log };
}

/** A node whose output is a deterministic function of its inputs. */
function node(
  ctx: ReturnType<typeof makeStore>,
  id: string,
  deps: string[],
  inputPaths: string[],
  output: string,
  version = 1,
): DagNode {
  return {
    id,
    deps,
    output,
    version,
    inputs: () => inputPaths.map((p) => ctx.store.get(p) ?? ''),
    run: async () => {
      ctx.log.push(id);
      ctx.store.set(output, `${id}(${inputPaths.map((p) => ctx.store.get(p) ?? '').join(',')})`);
    },
  };
}

const existsIn = (ctx: ReturnType<typeof makeStore>) => (p: string) => ctx.store.has(p);

describe('cacheKey', () => {
  const base: DagNode = {
    id: 'n', deps: [], output: 'o', version: 1,
    inputs: () => ['a', 'b'], run: async () => {},
  };

  it('is stable for identical inputs and version', () => {
    expect(cacheKey(base)).toBe(cacheKey({ ...base }));
  });

  it('changes when an input changes', () => {
    expect(cacheKey(base)).not.toBe(cacheKey({ ...base, inputs: () => ['a', 'B'] }));
  });

  it('changes when the step version changes', () => {
    expect(cacheKey(base)).not.toBe(cacheKey({ ...base, version: 2 }));
  });

  it('does not collide when input boundaries shift (joins are delimited)', () => {
    const ab: DagNode = { ...base, inputs: () => ['a', 'b'] };
    const cd: DagNode = { ...base, inputs: () => ['ab', ''] };
    expect(cacheKey(ab)).not.toBe(cacheKey(cd));
  });
});

describe('topoSort', () => {
  it('orders dependencies before dependents', () => {
    const ctx = makeStore();
    const a = node(ctx, 'a', [], [], 'a.out');
    const b = node(ctx, 'b', ['a'], ['a.out'], 'b.out');
    const c = node(ctx, 'c', ['b'], ['b.out'], 'c.out');
    const order = topoSort([c, a, b]).map((n) => n.id);
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'));
  });

  it('throws on a dependency cycle', () => {
    const ctx = makeStore();
    const a = node(ctx, 'a', ['b'], [], 'a.out');
    const b = node(ctx, 'b', ['a'], [], 'b.out');
    expect(() => topoSort([a, b])).toThrow(/cycle/i);
  });

  it('throws on an unknown dependency', () => {
    const ctx = makeStore();
    const a = node(ctx, 'a', ['ghost'], [], 'a.out');
    expect(() => topoSort([a])).toThrow(/unknown|ghost/i);
  });
});

describe('runDag', () => {
  it('rebuilds every node on a cold cache and runs each once', async () => {
    const ctx = makeStore();
    ctx.store.set('src', '1');
    const a = node(ctx, 'a', [], ['src'], 'a.out');
    const b = node(ctx, 'b', ['a'], ['a.out'], 'b.out');
    const cache: CacheState = {};

    const out = await runDag([a, b], { cache, outputExists: existsIn(ctx) });

    expect(out.map((o) => o.status)).toEqual(['rebuilt', 'rebuilt']);
    expect(ctx.log).toEqual(['a', 'b']);
    expect(cache.a).toBeTruthy();
    expect(cache.b).toBeTruthy();
  });

  it('skips fresh nodes on a warm cache with no input changes', async () => {
    const ctx = makeStore();
    ctx.store.set('src', '1');
    const a = node(ctx, 'a', [], ['src'], 'a.out');
    const b = node(ctx, 'b', ['a'], ['a.out'], 'b.out');
    const cache: CacheState = {};

    await runDag([a, b], { cache, outputExists: existsIn(ctx) });
    ctx.log.length = 0;
    const out = await runDag([a, b], { cache, outputExists: existsIn(ctx) });

    expect(out.map((o) => o.status)).toEqual(['fresh', 'fresh']);
    expect(ctx.log).toEqual([]);
  });

  it('rebuilds a node and cascades to its dependents when an input changes', async () => {
    const ctx = makeStore();
    ctx.store.set('src', '1');
    const a = node(ctx, 'a', [], ['src'], 'a.out');
    const b = node(ctx, 'b', ['a'], ['a.out'], 'b.out');
    const cache: CacheState = {};

    await runDag([a, b], { cache, outputExists: existsIn(ctx) });
    ctx.store.set('src', '2'); // edit upstream content
    ctx.log.length = 0;
    const out = await runDag([a, b], { cache, outputExists: existsIn(ctx) });

    expect(out.map((o) => o.status)).toEqual(['rebuilt', 'rebuilt']);
    expect(ctx.log).toEqual(['a', 'b']);
  });

  it('leaves an unrelated sibling fresh when only one branch changes', async () => {
    const ctx = makeStore();
    ctx.store.set('s1', '1');
    ctx.store.set('s2', '1');
    const a = node(ctx, 'a', [], ['s1'], 'a.out');
    const b = node(ctx, 'b', [], ['s2'], 'b.out');
    const cache: CacheState = {};

    await runDag([a, b], { cache, outputExists: existsIn(ctx) });
    ctx.store.set('s1', '2');
    ctx.log.length = 0;
    const out = await runDag([a, b], { cache, outputExists: existsIn(ctx) });

    const byId = Object.fromEntries(out.map((o) => [o.id, o.status]));
    expect(byId).toEqual({ a: 'rebuilt', b: 'fresh' });
    expect(ctx.log).toEqual(['a']);
  });

  it('rebuilds when the cached output no longer exists', async () => {
    const ctx = makeStore();
    ctx.store.set('src', '1');
    const a = node(ctx, 'a', [], ['src'], 'a.out');
    const cache: CacheState = {};

    await runDag([a], { cache, outputExists: existsIn(ctx) });
    ctx.store.delete('a.out'); // artifact deleted out from under the cache
    ctx.log.length = 0;
    const out = await runDag([a], { cache, outputExists: existsIn(ctx) });

    expect(out[0].status).toBe('rebuilt');
    expect(ctx.log).toEqual(['a']);
  });

  it('marks a failing node error, skips its dependents, and clears its cache', async () => {
    const ctx = makeStore();
    ctx.store.set('src', '1');
    const a: DagNode = {
      id: 'a', deps: [], output: 'a.out', version: 1,
      inputs: () => [ctx.store.get('src') ?? ''],
      run: async () => { throw new Error('boom'); },
    };
    const b = node(ctx, 'b', ['a'], ['a.out'], 'b.out');
    const cache: CacheState = {};

    const out = await runDag([a, b], { cache, outputExists: existsIn(ctx) });

    const byId = Object.fromEntries(out.map((o) => [o.id, o.status]));
    expect(byId).toEqual({ a: 'error', b: 'skipped' });
    expect(out.find((o) => o.id === 'a')?.error).toMatch(/boom/);
    expect(cache.a).toBeUndefined();
  });

  it('dry run reports rebuilds without running or writing the cache', async () => {
    const ctx = makeStore();
    ctx.store.set('src', '1');
    const a = node(ctx, 'a', [], ['src'], 'a.out');
    const cache: CacheState = {};

    const out = await runDag([a], { cache, dryRun: true, outputExists: existsIn(ctx) });

    expect(out[0].status).toBe('rebuilt');
    expect(ctx.log).toEqual([]);
    expect(cache.a).toBeUndefined();
  });
});
