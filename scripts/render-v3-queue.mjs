/**
 * Crash-resilient, resumable v3 render queue.
 *
 * Why this exists: batch renders on this box hit ffmpeg 0xC0000142 (Windows
 * desktop-heap exhaustion) after ~3-4 lessons in one process, then cascade-fail.
 * This queue renders ONE lesson per FRESH process (so the OS reclaims all Chrome
 * handles between lessons), low concurrency, with retry<=3 then skip, a pause to
 * let resources settle, and per-lesson gate + Drive publish. Resumable: it skips
 * any lesson already in out/v3 with a healthy size, so a teardown/restart just
 * continues. Never hangs: each render is bounded by render-lesson.ts's 70-min
 * watchdog plus an 80-min spawn kill.
 *
 * Run:  node scripts/render-v3-queue.mjs   (foreground or background)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_V3 = path.join(ROOT, 'out', 'v3');
const KF = path.join(ROOT, 'artifacts', 'keyframes-review');
const LOG = path.join(ROOT, 'agent-ops', 'logs', 'render-v3-queue.log');
const DRIVE = '<DRIVE_ROOT>/Content Development/Curriculum';
const MAX_RETRIES = 3;
const MIN_MB = 5;
const SETTLE_MS = 8000;        // let desktop-heap recover between attempts/lessons
const SPAWN_KILL_MS = 80 * 60 * 1000;

fs.mkdirSync(OUT_V3, { recursive: true });

function log(event, fields = {}) {
  const line = JSON.stringify({ t: new Date().toISOString(), event, ...fields });
  fs.appendFileSync(LOG, line + '\n');
  console.log(line);
}
const sleep = (ms) => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };
const sizeMB = (p) => { try { return fs.statSync(p).size / 1e6; } catch { return 0; } };

// ---- discover lessons from the keyframe set, skip ones already rendered ----
function allLessons() {
  const ids = [];
  for (const topic of fs.readdirSync(KF)) {
    const tdir = path.join(KF, topic);
    if (!fs.statSync(tdir).isDirectory()) continue;
    for (const id of fs.readdirSync(tdir)) {
      if (fs.statSync(path.join(tdir, id)).isDirectory()) ids.push(id);
    }
  }
  // priority: listed ids first, then the rest
  const PRI = ['topic-3-lesson-1','topic-1-lesson-2','topic-0-lesson-1'];
  return [...new Set(ids)].sort((a, b) => {
    const ia = PRI.indexOf(a), ib = PRI.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b, undefined, { numeric: true });
  });
}

function renderOnce(id) {
  const env = { ...process.env, RENDER_OUT_DIR: 'out/v3', RENDER_CONCURRENCY: '2', RENDER_FRAME_TIMEOUT_MS: '180000', RENDER_TIMEOUT_MIN: '70' };
  const r = spawnSync('npx', ['tsx', 'scripts/render-lesson.ts', id], { cwd: ROOT, env, stdio: 'inherit', shell: true, timeout: SPAWN_KILL_MS });
  return r.status === 0 && sizeMB(path.join(OUT_V3, `${id}.mp4`)) >= MIN_MB;
}

// ---- lightweight per-lesson gate: audio present + BT.709 + not silent ----
function checkVideo(mp4) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,color_space', '-of', 'default=nw=1', mp4], { encoding: 'utf8' });
  const out = (probe.stdout || '');
  const hasAudio = /codec_type=audio/.test(out);
  const bt709 = /color_space=bt709/.test(out);
  const vd = spawnSync('ffmpeg', ['-hide_banner', '-i', mp4, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /mean_volume:\s*(-?\d+(?:\.\d+)?) dB/.exec(vd.stderr || '');
  const meanDb = m ? parseFloat(m[1]) : -999;
  const audible = meanDb > -60; // -91 = silent
  return { hasAudio, bt709, meanDb, audible, ok: hasAudio && bt709 && audible };
}

// ---- publish to Drive alongside the original, matching its filename + " v3" ----
function moduleDir(id) {
  const m = /^topic-(\d+)-lesson-\d+$/.exec(id);
  return m ? fs.readdirSync(DRIVE).find((d) => new RegExp(`^Module ${m[1]} `).test(d)) : null;
}
function lessonDir(modDir, id) {
  const base = path.join(DRIVE, modDir);
  let pref;
  { const m = /^topic-(\d+)-lesson-(\d+)$/.exec(id); pref = new RegExp(`^Lesson ${m[1]}\\.${m[2]} `); }
  const hit = fs.readdirSync(base).find((d) => pref.test(d));
  return hit ? path.join(base, hit) : null;
}
function publish(id) {
  try {
    if (!fs.existsSync(DRIVE)) { log('publish.skip', { id, why: 'drive not mounted' }); return; }
    const md = moduleDir(id); if (!md) { log('publish.skip', { id, why: 'module folder not found' }); return; }
    const ld = lessonDir(md, id); if (!ld) { log('publish.skip', { id, why: 'lesson folder not found' }); return; }
    const existing = fs.readdirSync(ld).find((f) => / Video\.mp4$/.test(f));
    const destName = existing ? existing.replace(/\.mp4$/, ' v3.mp4') : `${id} Video v3.mp4`;
    fs.copyFileSync(path.join(OUT_V3, `${id}.mp4`), path.join(ld, destName));
    log('publish.ok', { id, dest: `${path.basename(md)}/${path.basename(ld)}/${destName}` });
  } catch (e) { log('publish.fail', { id, err: String(e).slice(0, 200) }); }
}

// ---- main serial loop ----
const lessons = allLessons();
log('queue.start', { total: lessons.length, lessons });
let done = 0, skipped = 0;
for (const id of lessons) {
  const mp4 = path.join(OUT_V3, `${id}.mp4`);
  if (sizeMB(mp4) >= MIN_MB) { log('lesson.already', { id, mb: +sizeMB(mp4).toFixed(1) }); done++; continue; }
  let ok = false;
  for (let attempt = 1; attempt <= MAX_RETRIES && !ok; attempt++) {
    log('render.try', { id, attempt });
    try { ok = renderOnce(id); } catch (e) { log('render.err', { id, attempt, err: String(e).slice(0, 200) }); ok = false; }
    log(ok ? 'render.ok' : 'render.fail', { id, attempt, mb: +sizeMB(mp4).toFixed(1) });
    if (!ok) sleep(SETTLE_MS); // let the box recover before retry (0xC0000142 mitigation)
  }
  if (!ok) { log('lesson.skipped', { id, why: `failed ${MAX_RETRIES}x` }); skipped++; sleep(SETTLE_MS); continue; }
  const v = checkVideo(mp4);
  log('gate', { id, ...v });
  if (v.ok) publish(id); else log('publish.held', { id, why: 'gate not green', ...v });
  done++;
  sleep(SETTLE_MS);
}
log('queue.done', { done, skipped, total: lessons.length });
