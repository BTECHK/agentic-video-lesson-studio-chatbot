/**
 * Gate L — automated layout-integrity gate (#73).
 *
 *   npm run gate:layout -- <lessonId>
 *
 * Renders one settled still per scene of the lesson with the LayoutProbe
 * mounted (input prop `layoutProbe: true`). The probe measures the real render
 * DOM in headless Chrome and reports element rects over the console; this
 * script collects the reports via onBrowserLog, runs the pure analyzer
 * (no-clip / no-text-outside-safe-area / no-text-overlap), writes the gate
 * artifact `content/lessons/<id>/review/layout-gate.md` (Verdict: PASS|FIX),
 * and exits non-zero on FIX. Stills land in out/verify/layout/ as evidence.
 */
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import { runMain } from '../src/lib/logger';
import { LessonSchema } from '../content/schemas/lesson';
import { BRAND, SAFE_AREA } from '../src/brand/tokens';
import {
  analyzeFrame,
  renderLayoutGateMd,
  type FrameReport,
  type LayoutViolation,
} from '../src/lib/gate-layout';
import { LAYOUT_PROBE_SENTINEL } from '../src/compositions/lesson-scenes/LayoutProbe';

runMain('gate:layout', async (log) => {
  const lessonId = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!lessonId) {
    log.error('usage: npm run gate:layout -- <lessonId>');
    return 1;
  }

  const lessonPath = path.join(process.cwd(), 'content', 'lessons', lessonId, 'lesson.json');
  if (!fs.existsSync(lessonPath)) {
    log.error(`lesson.json not found: ${lessonPath}`);
    return 1;
  }
  const lesson = LessonSchema.parse(JSON.parse(fs.readFileSync(lessonPath, 'utf-8')));

  // One settled frame per scene — 80% in, animations eased, content at rest.
  const sampledFrames = lesson.scenes.map((s) =>
    Math.min(s.start + Math.max(Math.floor(s.duration * 0.8), 1), s.start + s.duration - 1),
  );

  log.info(`bundling for layout gate`, { lessonId, frames: sampledFrames.join(',') });
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'src/index.ts') });

  const inputProps = { lesson, layoutProbe: true };
  const composition = await selectComposition({ serveUrl, id: 'LessonVideo', inputProps });

  const outDir = path.join(process.cwd(), 'out', 'verify', 'layout');
  fs.mkdirSync(outDir, { recursive: true });

  const violations: LayoutViolation[] = [];
  for (const frame of sampledFrames) {
    let report: FrameReport | null = null;
    await renderStill({
      composition,
      serveUrl,
      inputProps,
      frame,
      imageFormat: 'png',
      output: path.join(outDir, `${lessonId}-f${frame}.png`),
      onBrowserLog: (logEntry) => {
        const text = logEntry.text ?? '';
        const at = text.indexOf(LAYOUT_PROBE_SENTINEL);
        if (at !== -1) {
          try {
            report = JSON.parse(text.slice(at + LAYOUT_PROBE_SENTINEL.length)) as FrameReport;
          } catch {
            /* malformed probe payload — handled below as missing */
          }
        }
      },
    });
    if (!report) {
      violations.push({
        kind: 'clip',
        frame,
        detail: 'LayoutProbe emitted no report — probe not mounted or render failed',
      });
      log.warn(`frame ${frame}: no probe report`);
      continue;
    }
    const found = analyzeFrame(
      report,
      { width: BRAND.video.width, height: BRAND.video.height },
      SAFE_AREA,
    );
    violations.push(...found);
    log.info(
      `frame ${frame}: ${(report as FrameReport).els.length} elements, ${found.length} violation(s)`,
    );
  }

  const md = renderLayoutGateMd(lessonId, sampledFrames, violations);
  const artifactDir = path.join(process.cwd(), 'content', 'lessons', lessonId, 'review');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'layout-gate.md'), md, 'utf-8');

  if (violations.length === 0) {
    log.info(`Gate L PASS — no layout violations`, { lessonId });
    return 0;
  }
  for (const v of violations) log.warn(`[${v.kind}] frame ${v.frame}: ${v.detail}`);
  log.warn(`Gate L FIX — ${violations.length} violation(s)`, { lessonId });
  return 1;
});
