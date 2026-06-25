import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Keyframe-review extractor. For each scene in a rendered lesson, pulls the SETTLED
 * frame (start + 80% of duration, where the scene has finished animating in) out of
 * the final MP4 via ffmpeg — i.e. the exact pixels a viewer sees — into a per-lesson
 * `keyframes-review/` folder for a fast visual QC pass (Claude Design / human).
 *
 * Light: single-frame ffmpeg decodes, NOT a re-render. Reads the post-align lesson.json
 * (measured timings) so each grab lands on the right scene.
 *
 *   tsx scripts/keyframes-review.ts <lessonId> [<lessonId> ...]
 * Output: artifacts/keyframes-review/<topicDir>/<id>/NN-<sceneId>.png + index.md
 */
const FPS = 30;

function topicDir(id: string): string {
  const m = id.match(/^(topic-\d+|bonus)/);
  return m ? m[1] : 'other';
}

function extract(id: string): { id: string; scenes: number } | null {
  const mp4 = `out/${id}.mp4`;
  const lj = `content/lessons/${id}/lesson.json`;
  if (!existsSync(mp4)) { console.error(`SKIP ${id}: no ${mp4}`); return null; }
  if (!existsSync(lj)) { console.error(`SKIP ${id}: no ${lj}`); return null; }
  const lesson = JSON.parse(readFileSync(lj, 'utf8'));
  const outDir = join('artifacts', 'keyframes-review', topicDir(id), id);
  mkdirSync(outDir, { recursive: true });
  const rows: string[] = [];
  lesson.scenes.forEach((s: { id: string; type: string; start: number; duration: number }, i: number) => {
    const settledSec = (s.start + Math.floor(s.duration * 0.8)) / FPS;
    const n = String(i + 1).padStart(2, '0');
    const png = `${n}-${s.type}-${s.id}.png`;
    execFileSync('ffmpeg', ['-y', '-ss', settledSec.toFixed(2), '-i', mp4, '-frames:v', '1', join(outDir, png)], {
      stdio: 'ignore',
    });
    rows.push(`- ${n}. \`${s.type}\` — **${s.id}** @ ${settledSec.toFixed(1)}s → ${png}`);
  });
  writeFileSync(
    join(outDir, 'index.md'),
    `# Keyframes — ${id}\n\n**${lesson.lesson.title}** · ${lesson.lesson.module} · ${lesson.scenes.length} scenes\n\n${rows.join('\n')}\n\nReview against \`agent-ops/KEYFRAME-QC-PROMPT.md\` (brand + layout + spacing).\n`,
  );
  console.log(`${id}: ${lesson.scenes.length} keyframes -> ${outDir}`);
  return { id, scenes: lesson.scenes.length };
}

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error('usage: tsx scripts/keyframes-review.ts <lessonId> [<lessonId> ...]');
  process.exit(1);
}
let total = 0;
for (const id of ids) {
  const r = extract(id);
  if (r) total += r.scenes;
}
console.log(`\ndone: ${total} keyframes across ${ids.length} lesson(s).`);
