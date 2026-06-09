/**
 * Gate L — layout integrity (#73). Pure geometry analysis of DOM measurements
 * captured by the LayoutProbe inside headless Chrome at sampled frames.
 *
 * Rules (each maps to a Gate C 2026-06-08 human-caught defect class):
 *  - clip:      content overflows a clipped box (the fontSize-200-in-height-90 glyph)
 *  - safe-area: a text leaf crosses the SAFE_AREA inset (the glyph spilling upward)
 *  - overlap:   two unrelated text leaves materially intersect (mark over eyebrow,
 *               title line collision)
 *
 * Decorative elements (`data-decor`) are exempt — watermarks may bleed and
 * sit behind text by design.
 */

export interface MeasuredRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MeasuredEl {
  /** index within the frame report */
  i: number;
  /** indices of measured ancestors of this element */
  ancestors: number[];
  tag: string;
  /** text snippet for diagnostics ('' when not a text leaf) */
  text: string;
  /** has direct non-whitespace text children */
  textLeaf: boolean;
  /** inside a [data-decor] subtree */
  decor: boolean;
  rect: MeasuredRect;
  /** scroll size exceeds client size on a box that cannot paint overflow */
  clipped: boolean;
}

export interface FrameReport {
  frame: number;
  els: MeasuredEl[];
}

export interface LayoutViolation {
  kind: 'clip' | 'safe-area' | 'overlap';
  frame: number;
  detail: string;
}

const OVERLAP_MIN_PX = 6;
const OVERLAP_MIN_AREA_RATIO = 0.1;
const EDGE_TOLERANCE = 0.5;

function snippet(el: MeasuredEl): string {
  const t = el.text.length > 40 ? `${el.text.slice(0, 40)}…` : el.text;
  return `<${el.tag}> "${t}"`;
}

export function analyzeFrame(
  report: FrameReport,
  video: { width: number; height: number },
  safe: { x: number; y: number },
): LayoutViolation[] {
  const violations: LayoutViolation[] = [];
  const els = report.els.filter((e) => !e.decor);

  for (const el of els) {
    if (el.clipped) {
      violations.push({
        kind: 'clip',
        frame: report.frame,
        detail: `${snippet(el)} content overflows its clipped box (${el.rect.w}×${el.rect.h})`,
      });
    }
    if (el.textLeaf) {
      const r = el.rect;
      const breaches: string[] = [];
      if (r.x < safe.x - EDGE_TOLERANCE) breaches.push('left');
      if (r.y < safe.y - EDGE_TOLERANCE) breaches.push('top');
      if (r.x + r.w > video.width - safe.x + EDGE_TOLERANCE) breaches.push('right');
      if (r.y + r.h > video.height - safe.y + EDGE_TOLERANCE) breaches.push('bottom');
      if (breaches.length) {
        violations.push({
          kind: 'safe-area',
          frame: report.frame,
          detail: `${snippet(el)} crosses the ${breaches.join('+')} safe inset at (${Math.round(r.x)},${Math.round(r.y)}) ${Math.round(r.w)}×${Math.round(r.h)}`,
        });
      }
    }
  }

  const textEls = els.filter((e) => e.textLeaf);
  for (let a = 0; a < textEls.length; a++) {
    for (let b = a + 1; b < textEls.length; b++) {
      const ea = textEls[a];
      const eb = textEls[b];
      if (ea.ancestors.includes(eb.i) || eb.ancestors.includes(ea.i)) continue;
      const ox = Math.min(ea.rect.x + ea.rect.w, eb.rect.x + eb.rect.w) - Math.max(ea.rect.x, eb.rect.x);
      const oy = Math.min(ea.rect.y + ea.rect.h, eb.rect.y + eb.rect.h) - Math.max(ea.rect.y, eb.rect.y);
      if (ox <= OVERLAP_MIN_PX || oy <= OVERLAP_MIN_PX) continue;
      const overlapArea = ox * oy;
      const minArea = Math.min(ea.rect.w * ea.rect.h, eb.rect.w * eb.rect.h);
      if (minArea <= 0 || overlapArea / minArea <= OVERLAP_MIN_AREA_RATIO) continue;
      violations.push({
        kind: 'overlap',
        frame: report.frame,
        detail: `${snippet(ea)} overlaps ${snippet(eb)} by ${Math.round(ox)}×${Math.round(oy)}px`,
      });
    }
  }

  return violations;
}

/** Gate artifact body — first line is the machine-readable verdict (gate-status convention). */
export function renderLayoutGateMd(
  lessonId: string,
  sampledFrames: number[],
  violations: LayoutViolation[],
): string {
  const verdict = violations.length === 0 ? 'PASS' : 'FIX';
  const lines: string[] = [
    `Verdict: ${verdict}`,
    '',
    `# Gate L — Layout integrity · ${lessonId}`,
    '',
    `- **Sampled frames:** ${sampledFrames.join(', ')}`,
    `- **Checks:** no clipping · no text outside safe-area · no text-on-text overlap`,
    `- **Sensor:** DOM measurement (LayoutProbe) in the real render DOM, headless Chrome`,
    '',
  ];
  if (violations.length === 0) {
    lines.push('No layout violations at any sampled frame.');
  } else {
    lines.push(`## Violations (${violations.length})`, '');
    lines.push('| Frame | Kind | Detail |');
    lines.push('|---|---|---|');
    for (const v of violations) {
      lines.push(`| ${v.frame} | ${v.kind} | ${v.detail.replace(/\|/g, '\\|')} |`);
    }
  }
  lines.push('');
  return lines.join('\n');
}
