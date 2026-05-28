import { execSync } from 'node:child_process';

/**
 * #65: provenance for delivery runs. Prints the commit under test, a timestamp,
 * the target URL, and whether the server is fresh — so a green Playwright run can
 * be tied to an exact commit instead of "it passed on some server, somewhere".
 */
export default async function globalSetup() {
  let commit = 'unknown';
  try {
    commit = execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    /* not a git checkout — leave as unknown */
  }
  const port = process.env.PW_PORT ?? '3201';
  const reuse = process.env.PW_REUSE_SERVER === 'true';

  const line = '─'.repeat(64);
  console.log(line);
  console.log('[e2e] Playwright run');
  console.log(`[e2e] commit:      ${commit}`);
  console.log(`[e2e] started:     ${new Date().toISOString()}`);
  console.log(`[e2e] target:      http://localhost:${port}`);
  console.log(`[e2e] setup pid:   ${process.pid}`);
  console.log(`[e2e] server mode: ${reuse ? 'REUSE existing (PW_REUSE_SERVER=true)' : 'FRESH (no reuse)'}`);
  console.log(line);
}
