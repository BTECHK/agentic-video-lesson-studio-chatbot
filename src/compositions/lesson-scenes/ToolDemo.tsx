import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { ToolDemoContent } from './content-types';
import { ToolMark } from './ToolMark';
import { BRAND, LEADING } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, SimDisclaimer, renderAccented, sceneTitleStyle, useGlideIn, usePopIn } from './shared';
import { Pinwheel, Window } from './primitives';

const ACCENT_TINT = BRAND.colors.accentSoft;

/**
 * `tool-demo` (v2) — an ANIMATED in-tool simulation (no footage). Uses the
 * `Window` primitive (card-white, header with mark+title, SHADOW.window). A
 * prompt types into the composer (`TypeOn`), then a `Pinwheel` "generating"
 * beat, then output tiles reveal as flat `bgCard` + 4px-radius tiles. All motion
 * settles within the first ~7s then holds.
 */
export const ToolDemo: React.FC<SceneComponentProps> = ({ scene, showSimDisclaimer }) => {
  const c = scene.content as unknown as ToolDemoContent;
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const title = useGlideIn(10, 22);
  const win = useGlideIn(30, 30);
  const caption = useGlideIn(150, 16);

  // Phases (scene-relative seconds): prompt types 0→1.4s, "generating" 1.4–2.4s,
  // outputs reveal from ~2.6s, all settled well before the ~5s still frame.
  const promptTypeEnd = Math.round(1.4 * fps);
  const generating = frame > 1.4 * fps && frame < 2.4 * fps;
  const outputsStart = Math.round(2.6 * fps);

  const mark = <ToolMark name={c.tool.name} size={26} />;

  return (
    <SceneFrame align="flex-start" paddingX={120}>
      <Eyebrow delay={4}>{c.eyebrow}</Eyebrow>
      <h1 style={{ ...title, ...sceneTitleStyle(60) }}>{renderAccented(c.title)}</h1>

      {/* mock tool window using Window primitive */}
      <Window
        title={c.tool.name}
        mark={mark}
        composer={c.prompt}
        composerTyped={[0, promptTypeEnd]}
        style={{ ...win, width: '100%', position: 'relative' }}
        bodyStyle={{ gap: 18 }}
      >
        {/* persistent honesty chip — intrinsic, not author-supplied caption */}
        {showSimDisclaimer !== false && (
          <SimDisclaimer style={{ position: 'absolute', top: 22, right: 64 }} />
        )}
        {/* generating beat: Pinwheel + label */}
        {generating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: MUTED, fontSize: 20 }}>
            <Pinwheel size={28} />
            <span>Generating…</span>
          </div>
        )}

        {/* output tiles — reveal with pop-in stagger */}
        <div style={{ display: 'flex', gap: 20, opacity: frame >= outputsStart ? 1 : 0 }}>
          {c.outputs.map((o, i) => (
            <OutputTile key={o.id} output={o} delay={outputsStart + i * 14} />
          ))}
        </div>
      </Window>

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
        backgroundColor: BRAND.colors.bgCard,
        border: `1px solid ${BRAND.colors.border}`,
        borderRadius: BRAND.radius,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 220,
        boxShadow: 'none',
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
            border: `1px solid ${BRAND.colors.border}`,
            backgroundColor: BRAND.colors.bgAlt,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* abstracted, token-drawn chart glyph — not a captured render */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flex: 1 }}>
            {[40, 70, 52, 88].map((h, i) => (
              <span
                key={i}
                style={{ width: 14, height: `${h}%`, borderRadius: BRAND.radius, backgroundColor: BRAND.colors.accent }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: BRAND.font.weights.semiBold,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: MUTED,
            }}
          >
            IMAGE
          </span>
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
            border: `1px solid ${BRAND.colors.border}`,
            backgroundColor: BRAND.colors.bgAlt,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: BRAND.colors.borderStrong }} />
            ))}
          </div>
          <div style={{ height: 9, width: '70%', borderRadius: 4, backgroundColor: BRAND.colors.border }} />
          <div style={{ height: 9, width: '90%', borderRadius: 4, backgroundColor: BRAND.colors.border }} />
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
  const lines = output.lines;
  return (
    <TileShell delay={delay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 110 }}>
        <div
          style={{
            width: 64,
            height: 80,
            borderRadius: BRAND.radius,
            backgroundColor: ACCENT_TINT,
            border: `1px solid ${BRAND.colors.border}`,
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
        {lines && lines.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
            {lines.slice(0, 3).map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 14,
                  fontWeight: BRAND.font.weights.medium,
                  lineHeight: LEADING.caps,
                  color: MUTED,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 9, width: 120, borderRadius: 4, backgroundColor: BRAND.colors.border }} />
            <div style={{ height: 9, width: 90, borderRadius: 4, backgroundColor: BRAND.colors.border }} />
            <div style={{ height: 9, width: 110, borderRadius: 4, backgroundColor: BRAND.colors.border }} />
          </div>
        )}
      </div>
      <Caption label={label} sub={sub} badge={badge} />
    </TileShell>
  );
};
