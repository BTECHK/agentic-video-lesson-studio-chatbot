import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Keyframe-review extractor + per-lesson review.html builder.
 *
 * For each scene in a rendered lesson, pulls the SETTLED frame (start + 80% of duration,
 * where the scene has finished animating in) out of the final MP4 via ffmpeg — i.e. the
 * exact pixels a viewer sees — and writes a self-contained `review.html` contact sheet
 * (keyframe + scene type + timing + narration per scene) so Claude Design (or a human) can
 * open ONE page in a browser and review the whole lesson's design, then write feedback —
 * WITHOUT re-rendering anything.
 *
 * Idempotent + light: skips the ffmpeg grab if the PNG already exists; always rewrites
 * index.md + review.html. Single-frame decodes, NOT a re-render. Reads the post-align
 * lesson.json (measured timings) so each grab lands on the right scene.
 *
 *   tsx scripts/keyframes-review.ts <lessonId> [<lessonId> ...]
 * Output: artifacts/keyframes-review/<topicDir>/<id>/{NN-type-id.png, index.md, review.html}
 */
const FPS = 30;

function topicDir(id: string): string {
  const m = id.match(/^(topic-\d+|bonus)/);
  return m ? m[1] : 'other';
}

const esc = (s: string): string =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Scene {
  id: string;
  type: string;
  start: number;
  duration: number;
  narration?: { text?: string };
}

function reviewHtml(lesson: { id: string; lesson: { title: string; module: string }; scenes: Scene[] }, pngFor: (s: Scene, i: number) => string): string {
  const cards = lesson.scenes
    .map((s, i) => {
      const settled = ((s.start + Math.floor(s.duration * 0.8)) / FPS).toFixed(1);
      const dur = (s.duration / FPS).toFixed(1);
      const narr = s.narration?.text ?? '';
      return `<section class="scene">
  <div class="meta"><span class="n">${String(i + 1).padStart(2, '0')}</span>
    <span class="type">${esc(s.type)}</span><span class="id">${esc(s.id)}</span>
    <span class="t">settled @ ${settled}s · ${dur}s long</span></div>
  <img loading="lazy" src="${esc(pngFor(s, i))}" alt="${esc(s.id)} keyframe" />
  <p class="narr">${esc(narr) || '<em>(no narration)</em>'}</p>
</section>`;
    })
    .join('\n');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Review — ${esc(lesson.id)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{--bg:#EDE8E3;--card:#FDFBF9;--ink:#1C1C1C;--muted:rgba(28,28,28,.6);--accent:#8B2635;--line:rgba(28,28,28,.12)}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink);font-family:'Syne',sans-serif;padding:32px;max-width:1280px;margin:0 auto}
  header{border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:24px}
  h1{font-weight:700;font-size:34px;letter-spacing:-.02em}
  .sub{color:var(--muted);font-weight:600;margin-top:4px}
  .hint{color:var(--accent);font-weight:600;font-size:14px;margin-top:8px}
  .scene{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:16px;margin-bottom:24px}
  .meta{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:12px}
  .meta .n{font-weight:700;color:var(--accent);font-size:18px}
  .meta .type{font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.06em}
  .meta .id{font-weight:600;color:var(--muted);font-size:14px}
  .meta .t{margin-left:auto;color:var(--muted);font-size:13px;font-weight:600}
  img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:4px;background:#fff}
  .narr{margin-top:12px;color:var(--ink);font-weight:500;font-size:15px;line-height:1.5;white-space:pre-wrap}
</style></head>
<body>
<header><h1>${esc(lesson.lesson.title)}</h1>
  <div class="sub">${esc(lesson.id)} · ${esc(lesson.lesson.module)} · ${lesson.scenes.length} scenes</div>
  <div class="hint">Visual QC review — settled keyframe per scene (the real 1080p pixels). Review against the brand+layout contract (00-KEYFRAME-QC-PROMPT.md); write written feedback. Do NOT re-render.</div>
</header>
${cards}
</body></html>`;
}

function build(id: string): { id: string; scenes: number } | null {
  const mp4 = `${process.env.KEYFRAMES_SRC_DIR ?? 'out'}/${id}.mp4`;
  const lj = `content/lessons/${id}/lesson.json`;
  if (!existsSync(mp4)) { console.error(`SKIP ${id}: no ${mp4}`); return null; }
  if (!existsSync(lj)) { console.error(`SKIP ${id}: no ${lj}`); return null; }
  const lesson = JSON.parse(readFileSync(lj, 'utf8'));
  const outDir = join(process.env.KEYFRAMES_OUT_ROOT ?? join('artifacts', 'keyframes-review'), topicDir(id), id);
  mkdirSync(outDir, { recursive: true });
  const pngFor = (s: Scene, i: number) => `${String(i + 1).padStart(2, '0')}-${s.type}-${s.id}.png`;
  const rows: string[] = [];
  lesson.scenes.forEach((s: Scene, i: number) => {
    const settledSec = (s.start + Math.floor(s.duration * 0.8)) / FPS;
    const png = pngFor(s, i);
    const pngPath = join(outDir, png);
    if (!existsSync(pngPath)) {
      execFileSync('ffmpeg', ['-y', '-ss', settledSec.toFixed(2), '-i', mp4, '-frames:v', '1', pngPath], { stdio: 'ignore' });
    }
    rows.push(`- ${String(i + 1).padStart(2, '0')}. \`${s.type}\` — **${s.id}** @ ${settledSec.toFixed(1)}s → ${png}`);
  });
  writeFileSync(
    join(outDir, 'index.md'),
    `# Keyframes — ${id}\n\n**${lesson.lesson.title}** · ${lesson.lesson.module} · ${lesson.scenes.length} scenes\n\n${rows.join('\n')}\n\nOpen \`review.html\` for the full visual contact sheet. Review against \`agent-ops/KEYFRAME-QC-PROMPT.md\`.\n`,
  );
  writeFileSync(join(outDir, 'review.html'), reviewHtml(lesson, pngFor));
  console.log(`${id}: ${lesson.scenes.length} keyframes + review.html -> ${outDir}`);
  return { id, scenes: lesson.scenes.length };
}

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error('usage: tsx scripts/keyframes-review.ts <lessonId> [<lessonId> ...]');
  process.exit(1);
}
let total = 0;
for (const id of ids) {
  const r = build(id);
  if (r) total += r.scenes;
}
console.log(`\ndone: ${total} keyframes + ${ids.length} review.html page(s).`);
