/**
 * Gate C (watch gate) runner — DoD Layer C wired as a pipeline step.
 *
 *   npm run gate:lesson -- <id>                 collect sensors + write the judge prompt
 *   npm run gate:lesson -- <id> --auto          ...then have headless Claude Code judge it
 *   npm run gate:lesson -- <id> --no-transcript frames-only (no Gemini sensor / no key)
 *   npm run gate:lesson -- <id> --provider gemini-chatbot --resolution 1024
 *
 * Sensors are dumb + deterministic: frames (watch.py, no key) + an optional audio
 * transcript (gemini-watch.py, a free-tier SENSOR). The JUDGE is Claude Code — never
 * a sensor model, never a raw API. `--auto` drives `claude -p` headless (no API key;
 * the host's logged-in session — same invocation shipping in
 * chatbot/src/lib/llm/claude-code-provider.ts). The gate writes
 * content/lessons/<id>/review/watch-gate.md and stops there; publishing stays human.
 */
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { runMain } from '../src/lib/logger';
import { runGate, type GateDeps, type GateOptions } from '../src/lib/gate-lesson';
import { judgeViaClaudeCode } from '../src/lib/claude-judge';

/** Run a Python sensor; return stdout. stderr is the sensor's progress log. */
function runPython(argv: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    // PYTHONIOENCODING=utf-8 so the sensor's unicode (em-dashes, arrows) survives
    // Windows' default cp1252 stdout instead of arriving as replacement chars.
    const child = spawn('python', argv, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`python ${argv[0]} exited ${code}: ${err.slice(-400)}`))));
  });
}

runMain('gate:lesson', async (log) => {
  const args = process.argv.slice(2);
  const lessonId = args.find((a) => !a.startsWith('--'));
  if (!lessonId) {
    log.error('usage: npm run gate:lesson -- <lessonId> [--auto] [--no-transcript] [--provider <id>] [--resolution <px>]');
    return 1;
  }
  const providerIdx = args.indexOf('--provider');
  const resIdx = args.indexOf('--resolution');
  const opts: GateOptions = {
    mode: args.includes('--auto') ? 'auto' : 'collect',
    provider: providerIdx !== -1 && args[providerIdx + 1] ? args[providerIdx + 1] : 'gemini-voice',
    transcript: !args.includes('--no-transcript'),
    resolution: resIdx !== -1 && args[resIdx + 1] ? Number(args[resIdx + 1]) : 1024,
  };

  const deps: GateDeps = {
    cwd: process.cwd(),
    exists: (p) => fs.existsSync(p),
    ensureDir: (p) => fs.mkdirSync(p, { recursive: true }),
    runPython,
    judge: judgeViaClaudeCode,
    readText: (p) => fs.readFileSync(p, 'utf-8'),
    writeText: (p, s) => fs.writeFileSync(p, s),
    log,
  };

  const res = await runGate(lessonId, opts, deps);
  if (res.verdict === 'pending') {
    log.info('Gate C collected (no verdict yet — collect mode).', { lessonId });
    return 0;
  }
  log.info(`Gate C verdict: ${res.verdict}`, { lessonId, verdictPath: res.verdictPath });
  // The gate does NOT clear publish. Publishing stays a separate human step (Phase 4
  // enforces all three gates on the publish action). FIX/UNKNOWN is surfaced, not blocked here.
  return 0;
});
