import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function gitShortSha(cwd) {
  try {
    return execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function isoStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function commandName(base) {
  return base;
}

function quoteForCmd(arg) {
  if (!/[ \t"]/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

const chatbotDir = process.cwd();
const repoRoot = path.resolve(chatbotDir, '..');
const commit = gitShortSha(repoRoot);
const runId = `${isoStamp()}-${commit}`;
const evidenceDir = path.join(repoRoot, '.planning', 'verification', 'e2e', runId);
const outputDir = path.join(evidenceDir, 'test-results');
const resultsJson = path.join(evidenceDir, 'playwright-results.json');
const logFile = path.join(evidenceDir, 'playwright.log');
const summaryFile = path.join(evidenceDir, 'summary.json');

mkdirSync(outputDir, { recursive: true });

const env = {
  ...process.env,
  PW_REUSE_SERVER: 'false',
  PLAYWRIGHT_JSON_OUTPUT_FILE: resultsJson,
};

const pwArgs = ['playwright', 'test', '--output', outputDir, '--reporter', 'list,json'];
const isWindows = process.platform === 'win32';
const runCommand = isWindows ? 'cmd.exe' : commandName('npx');
const runArgs = isWindows
  ? ['/d', '/s', '/c', ['npx', ...pwArgs.map(quoteForCmd)].join(' ')]
  : pwArgs;
const runner = spawnSync(runCommand, runArgs, {
  cwd: chatbotDir,
  env,
  encoding: 'utf-8',
});

const stdout = runner.stdout ?? '';
const stderr = runner.stderr ?? '';
const spawnError = runner.error ? String(runner.error) : '';
writeFileSync(logFile, `${stdout}\n${stderr}\n${spawnError}\n`, 'utf-8');

const summary = {
  createdAt: new Date().toISOString(),
  commit,
  evidenceDir,
  command: `${runCommand} ${runArgs.join(' ')}`,
  status: runner.status ?? 1,
  spawnError: spawnError || null,
  hasJsonReport: existsSync(resultsJson),
  hasScreenshotsDir: existsSync(path.join(chatbotDir, 'e2e', 'screenshots')),
};
writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf-8');

if ((runner.status ?? 1) !== 0) {
  console.error(`[check:e2e] FAILED. Evidence: ${evidenceDir}`);
  process.exit(runner.status ?? 1);
}

console.log(`[check:e2e] PASS. Evidence: ${evidenceDir}`);
