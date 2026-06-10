import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { ToolData } from './types.js';

// Single source of truth: the curated tool repository the lessons + console share.
// Bundled into the image at build time (see Dockerfile) so the service is
// self-contained on Cloud Run. Public-safe data only — never index paid lesson
// bodies behind this public bot (see README "Security").
const here = dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR =
  process.env.TOOLS_DIR ?? join(here, '..', '..', 'content', 'tools');

let cache: ToolData[] | null = null;

export function loadTools(dir: string = TOOLS_DIR): ToolData[] {
  if (cache && dir === TOOLS_DIR) return cache;
  const tools = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as ToolData)
    .filter((t) => t && t.id && t.name);
  if (dir === TOOLS_DIR) cache = tools;
  return tools;
}
