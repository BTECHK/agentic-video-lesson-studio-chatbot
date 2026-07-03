// Fable e2e audit — guarded render campaign launcher (2026-07-02).
// Order: RAM gate -> walkthrough render+gate (small, validates audio fix early)
// -> audio preflight (Codex BLOCK #3: a narration scene without audioSrc/words
// must never enter the queue -> silent lesson) -> archive stale v3 mp4s ->
// hand the survivors to the proven resumable queue (render-v3-queue.mjs).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, renameSync, appendFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LOG = 'agent-ops/logs/audit-render-campaign.log';
const log = (m) => { const line = `${new Date().toISOString()} ${m}`; console.log(line); appendFileSync(LOG, line + '\n'); };

const LESSONS = [
  'topic-1-lesson-2', 'topic-1-lesson-3', 'topic-1-lesson-4', 'topic-3-lesson-1',
];

// ---- RAM gate (skippable for scheduled overnight runs via FORCE=1) ----
const freeGB = os.freemem() / 1e9;
if (process.env.FORCE !== '1' && freeGB < 7) {
  log(`RAM GATE: only ${freeGB.toFixed(1)}GB free (<7GB) — refusing to start. Re-run when idle or via the overnight task (FORCE=1).`);
  process.exit(2);
}
log(`campaign start: freeRAM=${freeGB.toFixed(1)}GB lessons=${LESSONS.length}`);

// ---- 1. walkthrough first (60s video; proves the volume={10} audio fix) ----
if (process.env.SKIP_WALKTHROUGH !== '1') {
  log('walkthrough: rendering (bt709)...');
  const r = spawnSync('npx', ['tsx', 'scripts/render-walkthrough.ts'], { stdio: 'inherit', shell: true, timeout: 40 * 60 * 1000 });
  log(`walkthrough render exit=${r.status}`);
  for (const gate of ['gate-motion', 'gate-media']) {
    const g = spawnSync('npx', ['tsx', `scripts/${gate}.ts`, 'output/video/platform-walkthrough.mp4'], { encoding: 'utf8', shell: true, timeout: 10 * 60 * 1000 });
    log(`walkthrough ${gate}: exit=${g.status} | ${(g.stdout || '').trim().split('\n').pop()}`);
  }
}

// ---- 2. audio preflight: every narrated scene needs audioSrc + words ----
function audioMissing(id) {
  const lj = `content/lessons/${id}/lesson.json`;
  if (!existsSync(lj)) return 'no lesson.json';
  const lesson = JSON.parse(readFileSync(lj, 'utf8'));
  const bad = (lesson.scenes || []).filter((s) => s.narration?.text && (!s.narration.audioSrc || !(s.narration.words?.length > 0)));
  return bad.length ? `${bad.length} scene(s): ${bad.map((s) => s.id).join(',')}` : null;
}
// Native TTS lane (2026-07-02): Docker Desktop crash-loops on this box
// (dockerInference socket bug), so the sidecar CLI runs on the host venv.
const TTS_ENV = { ...process.env, TTS_NATIVE: '1', TTS_PYTHON: process.env.TTS_PYTHON ?? 'python3' };
let excluded = LESSONS.filter((id) => audioMissing(id));
// self-heal: synthesize+align missing audio natively (Codex BLOCK #3 recovery path)
for (const id of excluded) {
  log(`tts+align recovery (native): ${id} (${audioMissing(id)})`);
  spawnSync('npx', ['tsx', 'scripts/synthesize-lesson.ts', id], { stdio: 'inherit', shell: true, timeout: 30 * 60 * 1000, env: TTS_ENV });
  spawnSync('npx', ['tsx', 'scripts/align-lesson.ts', `content/lessons/${id}/lesson.json`], { stdio: 'inherit', shell: true, timeout: 20 * 60 * 1000, env: TTS_ENV });
}
excluded = LESSONS.filter((id) => audioMissing(id));
const ok = LESSONS.filter((id) => !audioMissing(id));
for (const id of excluded) log(`PREFLIGHT EXCLUDE ${id}: ${audioMissing(id)} — tts+align did not recover it`);
log(`preflight: ${ok.length}/${LESSONS.length} lessons render-safe`);
if (ok.length === 0) { log('nothing render-safe; exiting'); process.exit(1); }

// ---- 3. archive stale v3 outputs so the resumable queue re-renders them ----
const ARCH = 'out/v3/archive-pre-audit';
mkdirSync(ARCH, { recursive: true });
for (const id of ok) {
  const p = `out/v3/${id}.mp4`;
  if (existsSync(p)) { renameSync(p, path.join(ARCH, `${id}.mp4`)); log(`archived stale ${p}`); }
}

// ---- 4. hand off to the proven queue (render+gate+publish, resumable) ----
log(`queue start: ${ok.join(' ')}`);
const q = spawnSync('node', ['scripts/render-v3-queue.mjs', ...ok], { stdio: 'inherit', shell: true });
log(`queue exit=${q.status}`);
process.exit(q.status ?? 1);
