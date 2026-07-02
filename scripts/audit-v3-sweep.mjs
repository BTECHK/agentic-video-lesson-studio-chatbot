// Serial technical-gate sweep for the Fable e2e audit (2026-07-02).
// For every delivered video: gate:motion + gate:media (+ duration probe), then
// settled-scene keyframes into artifacts/keyframes-review-v3/ for vision QC.
// Resumable: skips videos already in the results JSONL / PNGs that exist.
// ponytail: serial on purpose — ffmpeg+sharp own the machine, never parallelize.
import { execSync, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const RESULTS = 'artifacts/verification/fable-e2e-audit/gates.jsonl';
const KF_ROOT = 'artifacts/keyframes-review-v3';
mkdirSync('artifacts/verification/fable-e2e-audit', { recursive: true });

const lessons = [
  'topic-0-lesson-1',
  ...[1, 2, 3, 4, 5].map((n) => `topic-1-lesson-${n}`),
  'topic-3-lesson-1',
];
const extras = [
  { id: 'sizzle-16x9', mp4: 'out/sizzle-16x9.mp4' },
  { id: 'sizzle-9x16', mp4: 'out/sizzle-9x16.mp4' },
  { id: 'platform-walkthrough', mp4: 'output/video/platform-walkthrough.mp4' },
  { id: 'brand-showcase', mp4: 'output/video/brand-showcase.mp4' },
];

const done = new Set(
  existsSync(RESULTS)
    ? readFileSync(RESULTS, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l).id)
    : [],
);

function run(cmd, timeoutMs = 15 * 60 * 1000, env = {}) {
  try {
    const out = execSync(cmd, { timeout: timeoutMs, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } });
    return { ok: true, tail: out.trim().split('\n').slice(-3).join(' | ') };
  } catch (e) {
    const out = `${e.stdout ?? ''}\n${e.stderr ?? ''}`.trim();
    return { ok: false, tail: out.split('\n').slice(-4).join(' | ').slice(0, 500) };
  }
}

function probeDuration(mp4) {
  try {
    return +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], { encoding: 'utf8' }).trim();
  } catch { return null; }
}

const queue = [
  ...lessons.map((id) => ({ id, mp4: `out/v3/${id}.mp4`, lesson: true })),
  ...extras,
];

for (const { id, mp4, lesson } of queue) {
  if (done.has(id)) { console.log(`SKIP ${id} (already gated)`); continue; }
  if (!existsSync(mp4)) {
    appendFileSync(RESULTS, JSON.stringify({ id, mp4, error: 'missing file', ts: new Date().toISOString() }) + '\n');
    console.log(`MISSING ${id}: ${mp4}`);
    continue;
  }
  console.log(`GATING ${id} ...`);
  const motion = run(`npx tsx scripts/gate-motion.ts "${mp4}"`);
  const media = run(`npx tsx scripts/gate-media.ts "${mp4}"`);
  const rec = {
    id, mp4,
    durationSec: probeDuration(mp4),
    motion: motion.ok ? 'PASS' : 'FAIL', motionDetail: motion.tail,
    media: media.ok ? 'PASS' : 'FAIL', mediaDetail: media.tail,
    ts: new Date().toISOString(),
  };
  appendFileSync(RESULTS, JSON.stringify(rec) + '\n');
  console.log(`  -> motion=${rec.motion} media=${rec.media} dur=${rec.durationSec}s`);

  if (lesson) {
    const r = run(`npx tsx scripts/keyframes-review.ts ${id}`, 10 * 60 * 1000, { KEYFRAMES_SRC_DIR: 'out/v3', KEYFRAMES_OUT_ROOT: KF_ROOT });
    console.log(`  keyframes: ${r.ok ? 'ok' : 'FAIL ' + r.tail}`);
  }
}

// non-lesson videos: 8 evenly spaced frames each for vision QC
for (const { id, mp4 } of extras) {
  if (!existsSync(mp4)) continue;
  const dur = probeDuration(mp4);
  if (!dur) continue;
  const dir = join(KF_ROOT, 'other', id);
  mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= 8; i++) {
    const png = join(dir, `frame-${i}.png`);
    if (existsSync(png)) continue;
    try {
      execFileSync('ffmpeg', ['-y', '-ss', ((dur * i) / 9).toFixed(2), '-i', mp4, '-frames:v', '1', png], { stdio: 'ignore', timeout: 120000 });
    } catch { console.log(`frame fail ${id} #${i}`); }
  }
  console.log(`frames: ${id} -> ${dir}`);
}
console.log('SWEEP DONE');
