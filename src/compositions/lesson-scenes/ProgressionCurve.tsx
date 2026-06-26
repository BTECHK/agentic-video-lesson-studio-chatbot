import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { ProgressionCurveContent } from './content-types';
import { BRAND } from '../../brand/tokens';
import {
  SceneFrame,
  eyebrowStyle,
  sceneTitleStyle,
  useGlideIn,
  renderAccented,
} from './shared';

/**
 * `progression-curve` — labelled stage chips stepping UP a smooth rising path,
 * with an optional self-locating "where are you?" marker. The rising-curve
 * metaphor `feature-grid` can't carry (progression curve / levels / maturity model).
 *
 * Ported 1:1 from `progression-curve.reference.html` (the END pose is the base
 * state): SVG node coords, cubic curve math (`dx=(q.x-p.x)*0.42`), dotted axes,
 * 9px nodes (filled crimson = passed / card-white ring = upcoming), alternating
 * above/below chips with leader lines, optional destination pill, and the dashed
 * "?" marker with "you?" tag + dotted drop line in the early/relatable zone.
 *
 * Motion: path draws L→R (inOutCubic), chips stagger stepping up (outBack pop),
 * marker fades in then HOLDS with a slow pulse + idle drift (stays alive, never
 * settle-and-freeze).
 */

// SVG canvas + geometry constants — the literal values from the reference.
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const X_FIRST = 175;
const X_LAST = 1730;
const BASELINE = 885; // x-axis y
const Y_TOP = 240; // top of the y-axis
const PLOT_TOP = 250; // highest node y in the reference
const PLOT_BOTTOM = 770; // lowest node y in the reference
const NODE_R = 9;
const CHIP_OFFSET = 92; // chip center distance above/below its node

/**
 * Normalized rise profile (0 = lowest on canvas / bottom, 1 = highest / top),
 * sampled at each node. `dunning-kruger` traces a confidence bump (peak) → dip
 * across the first three nodes before the steady climb; `steady` is monotonic.
 * The dunning-kruger profile reproduces the reference NODES.
 */
function riseProfile(n: number, curve: 'steady' | 'dunning-kruger'): number[] {
  if (curve === 'dunning-kruger' && n >= 4) {
    // Reference y-values mapped to 0..1 over [PLOT_BOTTOM, PLOT_TOP]:
    // bump at node 2, dip at node 3, then steady rise to node n.
    const head = [0, 0.654, 0.279, 0.404];
    const climbStart = 0.404;
    const tail: number[] = [];
    for (let i = 4; i < n; i++) {
      const t = (i - 3) / (n - 1 - 3);
      tail.push(climbStart + (1 - climbStart) * t);
    }
    return [...head, ...tail];
  }
  // steady: monotonic rise across all nodes.
  return Array.from({ length: n }, (_, i) => i / (n - 1));
}

type Node = {
  tier: string;
  label: string;
  x: number;
  y: number;
  chip: 'above' | 'below';
  lit: boolean;
};

function buildNodes(c: ProgressionCurveContent): Node[] {
  const stages = c.stages;
  const n = stages.length;
  const curve = c.curve ?? 'steady';
  const rises = riseProfile(n, curve);
  // ~40% of stages are "passed" (lit) — matches 3 of 7 in the reference.
  const litCount = Math.max(1, Math.round(n * 0.4));
  return stages.map((s, i) => {
    const x = X_FIRST + ((X_LAST - X_FIRST) * i) / (n - 1);
    const y = PLOT_BOTTOM - rises[i] * (PLOT_BOTTOM - PLOT_TOP);
    // Place chip on the open side of the curve: below for valleys, above for peaks.
    const prev = i > 0 ? rises[i - 1] : rises[i];
    const next = i < n - 1 ? rises[i + 1] : rises[i];
    let chip: 'above' | 'below' = rises[i] >= (prev + next) / 2 ? 'above' : 'below';
    // The destination pill occupies the space above the last node — drop its chip
    // below so the two never overlap (matches the reference's final chip:"below").
    if (i === n - 1 && c.destination) chip = 'below';
    return {
      tier: s.tier ?? String(i + 1).padStart(2, '0'),
      label: s.label,
      x,
      y,
      chip,
      lit: i < litCount,
    };
  });
}

/** Cubic path through the nodes — the reference's `dx=(q.x-p.x)*0.42` smoothing. */
function curvePath(nodes: Node[]): string {
  let d = `M ${nodes[0].x} ${nodes[0].y}`;
  for (let i = 0; i < nodes.length - 1; i++) {
    const p = nodes[i];
    const q = nodes[i + 1];
    const dx = (q.x - p.x) * 0.42;
    d += ` C ${p.x + dx} ${p.y}, ${q.x - dx} ${q.y}, ${q.x} ${q.y}`;
  }
  return d;
}

export const ProgressionCurve: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as ProgressionCurveContent;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const nodes = buildNodes(c);
  const path = curvePath(nodes);
  const last = nodes[nodes.length - 1];

  // 1. Path draws left→right: stroke-dashoffset over ~1.0s (inOutCubic).
  const pathLen = 4200; // generous upper bound on path length (px)
  const draw = interpolate(frame, [18, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // 3. Marker: fades in after the chips, then HOLDS with a slow pulse + idle drift.
  const markerIn = interpolate(frame, [78, 96], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const mx = 520;
  const my = 720; // early/relatable zone — NOT pinned to a node
  const pulse = 1 + Math.sin(t * 2.4) * 0.06; // slow ring pulse
  const drift = Math.sin(t * 0.7) * 4; // idle vertical drift

  // Header glides in from the top-left safe area (reference: left 110, top 64),
  // anchored above the plot rather than vertically centered onto the curve.
  const eyebrowGlide = useGlideIn(6, 14);
  const titleGlide = useGlideIn(14, 30);

  return (
    <SceneFrame align="flex-start">
      {/* Header inset below the lesson chrome row (the "Sample Academy" watermark
          sits at top:64) so the eyebrow/title never collide with it — matches
          how the clean scenes start their header at SceneFrame's 120px top pad. */}
      <div style={{ position: 'absolute', left: 110, top: 120, maxWidth: 1100 }}>
        <div style={{ ...eyebrowGlide, ...eyebrowStyle() }}>
          <span
            style={{ width: 24, height: 2, backgroundColor: BRAND.colors.accent, borderRadius: BRAND.radius }}
          />
          {c.eyebrow}
        </div>
        <h1 style={{ ...titleGlide, ...sceneTitleStyle(66), marginTop: 14 }}>
          {renderAccented(c.title)}
        </h1>
      </div>

      {/* Full-bleed plot layer — SVG curve/axes/leaders/nodes + absolute HTML chips. */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          style={{ position: 'absolute', inset: 0, width: CANVAS_W, height: CANVAS_H }}
        >
          {/* Dotted axes */}
          <line
            x1={150}
            y1={BASELINE}
            x2={1790}
            y2={BASELINE}
            stroke={BRAND.colors.textDim}
            strokeWidth={1.5}
            strokeDasharray="1 9"
            strokeLinecap="round"
            opacity={0.5}
          />
          <line
            x1={150}
            y1={Y_TOP}
            x2={150}
            y2={BASELINE}
            stroke={BRAND.colors.textDim}
            strokeWidth={1.5}
            strokeDasharray="1 9"
            strokeLinecap="round"
            opacity={0.5}
          />

          {/* Leader lines from each node up/down to its chip */}
          {nodes.map((node, i) => {
            const cy = node.chip === 'above' ? node.y - CHIP_OFFSET : node.y + CHIP_OFFSET;
            const y2 = cy + (node.chip === 'above' ? 34 : -34);
            return (
              <line
                key={`leader-${i}`}
                x1={node.x}
                y1={node.y}
                x2={node.x}
                y2={y2}
                stroke={BRAND.colors.textDim}
                strokeWidth={1.5}
                opacity={interpolate(draw, [0.6, 1], [0, 1], { extrapolateRight: 'clamp' })}
              />
            );
          })}

          {/* The rising curve — draws L→R */}
          <path
            d={path}
            fill="none"
            stroke={BRAND.colors.accent}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={pathLen}
            strokeDashoffset={pathLen * (1 - draw)}
          />

          {/* Dotted drop line from the marker to the baseline (optional marker) */}
          {c.marker && (
            <line
              x1={mx}
              y1={my + 40 + drift}
              x2={mx}
              y2={BASELINE}
              stroke={BRAND.colors.accent}
              strokeWidth={1.5}
              strokeDasharray="2 7"
              opacity={0.65 * markerIn}
            />
          )}

          {/* Nodes — filled crimson (passed) / card-white ring (upcoming) */}
          {nodes.map((node, i) => (
            <circle
              key={`node-${i}`}
              cx={node.x}
              cy={node.y}
              r={NODE_R}
              fill={node.lit ? BRAND.colors.accent : BRAND.colors.bgCard}
              stroke={BRAND.colors.accent}
              strokeWidth={4}
              opacity={interpolate(draw, [0.4, 1], [0, 1], { extrapolateRight: 'clamp' })}
            />
          ))}
        </svg>

        {/* Stage chips — stepping UP the curve in a stagger (outBack pop) */}
        {nodes.map((node, i) => {
          const cy = node.chip === 'above' ? node.y - CHIP_OFFSET : node.y + CHIP_OFFSET;
          const p = interpolate(frame, [48 + i * 6, 48 + i * 6 + 16], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.back(1.6)),
          });
          return (
            <div
              key={`chip-${i}`}
              style={{
                position: 'absolute',
                left: node.x,
                top: cy,
                transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.6, 1])})`,
                opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
                background: BRAND.colors.bgCard,
                border: `1px solid ${BRAND.colors.border}`,
                borderRadius: BRAND.radius,
                padding: '11px 15px',
                minWidth: 96,
                boxShadow: '0 4px 12px rgba(28,28,28,0.05)',
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  fontWeight: BRAND.font.weights.bold,
                  fontSize: 14,
                  color: BRAND.colors.accent,
                  letterSpacing: '0.06em',
                }}
              >
                {node.tier}
              </div>
              <div
                style={{
                  fontWeight: BRAND.font.weights.semiBold,
                  fontSize: 21,
                  color: BRAND.colors.text,
                  marginTop: 1,
                }}
              >
                {node.label}
              </div>
            </div>
          );
        })}

        {/* Destination flag — crimson-on-accentSoft pill past the final node */}
        {c.destination && (
          <div
            style={{
              position: 'absolute',
              left: last.x - 6,
              top: last.y - 120,
              transform: `translate(-50%, -50%) scale(${interpolate(
                frame,
                [48 + nodes.length * 6, 48 + nodes.length * 6 + 16],
                [0.6, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6)) },
              )})`,
              opacity: interpolate(frame, [48 + nodes.length * 6, 48 + nodes.length * 6 + 10], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              fontWeight: BRAND.font.weights.bold,
              fontSize: 22,
              color: BRAND.colors.accent,
              background: BRAND.colors.accentSoft,
              border: '1px solid rgba(139,38,53,0.22)',
              borderRadius: BRAND.radius,
              padding: '8px 14px',
              whiteSpace: 'nowrap',
            }}
          >
            {c.destination}
          </div>
        )}

        {/* Marker — dashed "?" ring + "you?" tag, held with a slow pulse + drift */}
        {c.marker && (
          <>
            <div
              style={{
                position: 'absolute',
                left: mx,
                top: my + drift,
                transform: `translate(-50%, -50%) scale(${pulse})`,
                opacity: markerIn,
                width: 74,
                height: 74,
                borderRadius: '50%',
                border: `2px dashed ${BRAND.colors.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(253,251,249,0.6)',
              }}
            >
              <span
                style={{
                  fontWeight: BRAND.font.weights.extraBold,
                  fontSize: 30,
                  color: BRAND.colors.accent,
                }}
              >
                ?
              </span>
            </div>
            {/* "you?" tag — the short self-locating label that sits with the ring
                (the reference's marker-tag). The full prompt the `marker` field once
                carried is already spoken in narration + shown in LessonCaptions, so
                only this tag renders here — nothing wraps into the bottom chrome. */}
            <div
              style={{
                position: 'absolute',
                left: mx,
                top: my - 58 + drift,
                transform: 'translate(-50%, -50%)',
                opacity: markerIn,
                fontWeight: BRAND.font.weights.bold,
                fontSize: 18,
                color: BRAND.colors.accent,
                whiteSpace: 'nowrap',
              }}
            >
              you?
            </div>
          </>
        )}
      </div>
    </SceneFrame>
  );
};
