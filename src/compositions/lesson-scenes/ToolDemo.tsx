import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { ToolDemoContent } from './content-types';
import {
  BRAND,
  MUTED,
  HAIRLINE,
  SceneFrame,
  Eyebrow,
  renderAccented,
  useGlideIn,
  usePopIn,
} from './shared';

const CARD_BG = '#F7F4EF';
const ACCENT_TINT = 'rgba(139,38,53,0.10)';

/**
 * `tool-demo` — an ANIMATED in-tool simulation (no footage). A single mock tool
 * window shows the user's prompt, a brief "generating" state, then 1–3 output
 * tiles reveal (image / file / slides / app), so a capability is *shown* being
 * produced rather than told on a slide. Outputs are clearly stylized
 * representations — never a fabricated real screenshot.
 */
export const ToolDemo: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as ToolDemoContent;
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const title = useGlideIn(10, 22);
  const win = useGlideIn(30, 30);
  const caption = useGlideIn(150, 16);

  // Phases (scene-relative seconds): prompt settles ~1s, "generating" 1.4–2.4s,
  // outputs reveal from ~2.6s, all settled well before the ~5s still frame.
  const generating = frame > 1.4 * fps && frame < 2.4 * fps;
  const outputsStart = 2.6 * fps;

  return (
    <SceneFrame align="flex-start" paddingX={120}>
      <Eyebrow delay={4}>{c.eyebrow}</Eyebrow>
      <h1
        style={{
          ...title,
          margin: 0,
          fontWeight: BRAND.font.weights.extraBold,
          fontSize: 60,
          letterSpacing: '-0.02em',
        }}
      >
        {renderAccented(c.title)}
      </h1>

      {/* mock tool window */}
      <div
        style={{
          ...win,
          width: '100%',
          backgroundColor: CARD_BG,
          border: `2px solid ${HAIRLINE}`,
          borderRadius: BRAND.radius,
          overflow: 'hidden',
        }}
      >
        {/* window header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '18px 24px',
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: BRAND.radius,
              backgroundColor: BRAND.colors.accent,
              color: BRAND.colors.bgBase,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: BRAND.font.weights.extraBold,
              fontSize: 22,
            }}
          >
            {c.tool.name.charAt(0)}
          </div>
          <div style={{ fontWeight: BRAND.font.weights.bold, fontSize: 24 }}>{c.tool.name}</div>
        </div>

        {/* body */}
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* prompt bar */}
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '88%',
              backgroundColor: BRAND.colors.accent,
              color: BRAND.colors.bgBase,
              borderRadius: BRAND.radius,
              padding: '14px 18px',
              fontSize: 22,
              lineHeight: 1.4,
            }}
          >
            {c.prompt}
          </div>

          {/* generating shimmer, then output tiles */}
          {generating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: MUTED, fontSize: 20 }}>
              <Pulse /> Generating…
            </div>
          )}

          <div style={{ display: 'flex', gap: 20, opacity: frame > outputsStart ? 1 : 0 }}>
            {c.outputs.map((o, i) => (
              <OutputTile key={o.id} output={o} delay={outputsStart + i * 14} />
            ))}
          </div>
        </div>
      </div>

      {c.caption && (
        <div
          style={{
            ...caption,
            fontSize: 24,
            fontStyle: 'italic',
            color: MUTED,
          }}
        >
          {renderAccented(c.caption)}
        </div>
      )}
    </SceneFrame>
  );
};

const Pulse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 3));
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: 999,
        backgroundColor: BRAND.colors.accent,
        opacity: o,
        display: 'inline-block',
      }}
    />
  );
};

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      alignSelf: 'flex-start',
      fontSize: 15,
      fontWeight: BRAND.font.weights.bold,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: BRAND.colors.accent,
      backgroundColor: ACCENT_TINT,
      borderRadius: BRAND.radius,
      padding: '4px 10px',
    }}
  >
    {children}
  </span>
);

const TileShell: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const pop = usePopIn(delay);
  return (
    <div
      style={{
        ...pop,
        flex: 1,
        minWidth: 0,
        backgroundColor: BRAND.colors.bgBase,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: BRAND.radius,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 220,
      }}
    >
      {children}
    </div>
  );
};

const Caption: React.FC<{ label: string; sub?: string; badge?: string }> = ({ label, sub, badge }) => (
  <>
    {badge && <Badge>{badge}</Badge>}
    <div style={{ fontWeight: BRAND.font.weights.bold, fontSize: 21, lineHeight: 1.2 }}>{label}</div>
    {sub && <div style={{ fontSize: 17, color: MUTED, lineHeight: 1.35 }}>{sub}</div>}
  </>
);

/** Renders a stylized representation of a generated output by kind. */
const OutputTile: React.FC<{
  output: ToolDemoContent['outputs'][number];
  delay: number;
}> = ({ output, delay }) => {
  const { kind, label, sub, badge } = output;

  if (kind === 'image') {
    return (
      <TileShell delay={delay}>
        <div
          style={{
            height: 110,
            borderRadius: BRAND.radius,
            background: `linear-gradient(135deg, ${BRAND.colors.accent} 0%, rgba(139,38,53,0.45) 60%, ${ACCENT_TINT} 100%)`,
            display: 'flex',
            alignItems: 'flex-end',
            padding: 12,
            color: BRAND.colors.bgBase,
            fontSize: 14,
            fontWeight: BRAND.font.weights.bold,
            letterSpacing: '0.08em',
          }}
        >
          IMAGE
        </div>
        <Caption label={label} sub={sub} badge={badge} />
      </TileShell>
    );
  }

  if (kind === 'app') {
    return (
      <TileShell delay={delay}>
        <div
          style={{
            height: 110,
            borderRadius: BRAND.radius,
            border: `1px solid ${HAIRLINE}`,
            backgroundColor: CARD_BG,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: HAIRLINE }} />
            ))}
          </div>
          <div style={{ height: 9, width: '70%', borderRadius: 4, backgroundColor: HAIRLINE }} />
          <div style={{ height: 9, width: '90%', borderRadius: 4, backgroundColor: HAIRLINE }} />
          <div
            style={{
              marginTop: 'auto',
              alignSelf: 'flex-start',
              height: 18,
              width: 64,
              borderRadius: BRAND.radius,
              backgroundColor: BRAND.colors.accent,
            }}
          />
        </div>
        <Caption label={label} sub={sub} badge={badge} />
      </TileShell>
    );
  }

  // file / slides / doc / text → a document card
  const glyph = kind === 'slides' ? 'PPT' : kind === 'text' ? 'TXT' : 'DOC';
  return (
    <TileShell delay={delay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 110 }}>
        <div
          style={{
            width: 64,
            height: 80,
            borderRadius: BRAND.radius,
            backgroundColor: ACCENT_TINT,
            border: `1px solid ${HAIRLINE}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: BRAND.colors.accent,
            fontSize: 16,
            fontWeight: BRAND.font.weights.extraBold,
            letterSpacing: '0.04em',
          }}
        >
          {glyph}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 9, width: 120, borderRadius: 4, backgroundColor: HAIRLINE }} />
          <div style={{ height: 9, width: 90, borderRadius: 4, backgroundColor: HAIRLINE }} />
          <div style={{ height: 9, width: 110, borderRadius: 4, backgroundColor: HAIRLINE }} />
        </div>
      </div>
      <Caption label={label} sub={sub} badge={badge} />
    </TileShell>
  );
};
