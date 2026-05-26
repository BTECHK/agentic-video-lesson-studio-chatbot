// Auto-create chatbot/.env from .env.example on first dev run (#20).
// The dev server refuses to start without .env; the example ships safe mock
// defaults (LLM_PROVIDER=mock, no key), so copying it is safe. Idempotent:
// never overwrites an existing .env.
import { existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const env = path.join(root, '.env');
const example = path.join(root, '.env.example');

if (existsSync(env)) {
  process.exit(0);
}
if (!existsSync(example)) {
  console.warn('[ensure-env] no .env.example found; skipping');
  process.exit(0);
}
copyFileSync(example, env);
console.log('[ensure-env] created .env from .env.example (mock defaults) — edit to add an API key.');
