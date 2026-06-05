// lesson-ui.jsx — reusable UI primitives for the Module 1 lesson animation.
// Anthropic-style "warm minimalist" components: chat windows, pinwheels,
// tether lines, type-on text, tool logos. All driven by Stage time.

const BRAND = {
  bgBase: '#EDE8E3',
  bgAlt: '#F7F4F0',
  bgCard: '#FDFBF9',
  bgDark: '#E3DED9',
  text: '#1C1C1C',
  textMuted: 'rgba(28,28,28,0.6)',
  textDim: 'rgba(28,28,28,0.33)',
  accent: '#8B2635',
  accentSoft: 'rgba(139, 38, 53, 0.10)',
  border: 'rgba(28,28,28,0.08)',
  borderStrong: 'rgba(28,28,28,0.15)',
  font: '"Syne", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  radius: 4,
};
window.BRAND = BRAND;

// ─── Eyebrow + section label (consistent chrome across scenes) ─────────────
function Eyebrow({ children, color = BRAND.accent, size = 14, letterSpacing = '0.14em' }) {
  return (
    <div style={{
      fontSize: size, fontWeight: 600, color,
      letterSpacing, textTransform: 'uppercase',
    }}>{children}</div>
  );
}

// ─── TypeOn: types out a string character by character, blinking caret ────
function TypeOn({ text, start = 0, duration = 1.5, x, y, size = 24, color = BRAND.text,
  weight = 500, font = BRAND.font, letterSpacing = '-0.01em', maxWidth, caret = true }) {
  const t = useTime();
  const local = clamp((t - start) / duration, 0, 1);
  const chars = Math.floor(local * text.length);
  const visible = text.slice(0, chars);
  const showCaret = caret && t >= start && (t - start) < duration + 0.4;
  const blink = Math.floor(t * 2) % 2 === 0;

  return (
    <div style={{
      position: 'absolute', left: x, top: y, maxWidth,
      fontFamily: font, fontSize: size, fontWeight: weight,
      color, letterSpacing, lineHeight: 1.4,
      whiteSpace: 'pre-wrap',
    }}>
      {visible}
      {showCaret && (
        <span style={{
          display: 'inline-block',
          width: 2, height: size * 0.95,
          marginLeft: 2, verticalAlign: '-3px',
          background: BRAND.accent,
          opacity: blink ? 1 : 0.25,
        }}/>
      )}
    </div>
  );
}

// ─── Pinwheel: Anthropic-style "thinking" spinner. Semantic, not decorative.
// Uses a rotating ring of segments with stagger fade — replaces generic spinner.
function Pinwheel({ x, y, size = 56, color = BRAND.accent, segments = 8, speed = 1.4 }) {
  const t = useTime();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const segs = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const dx = cx + r * Math.cos(angle);
    const dy = cy + r * Math.sin(angle);
    const phase = (t * speed - i / segments) % 1;
    const opacity = phase < 0 ? phase + 1 : phase;
    segs.push(
      <circle key={i} cx={dx} cy={dy} r={size * 0.06}
        fill={color} opacity={0.15 + opacity * 0.85} />
    );
  }
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{segs}</svg>
    </div>
  );
}

// ─── Tether: a hand-drawn squiggly path that draws itself in then holds.
// stroke-dasharray animation creates the "drawing" effect.
function Tether({ d, start = 0, drawDur = 1.2, color = BRAND.accent,
  strokeWidth = 3, width = 1920, height = 1080, dasharray }) {
  const t = useTime();
  const local = clamp((t - start) / drawDur, 0, 1);
  const eased = Easing.easeInOutCubic(local);
  // approximate path length — overshoot the actual length, doesn't matter
  const pathLen = 2400;
  const drawn = pathLen * eased;
  const remaining = pathLen - drawn;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      <path d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dasharray || `${drawn} ${remaining}`}
      />
    </svg>
  );
}

// ─── Chat bubble (user or AI) ──────────────────────────────────────────────
function ChatBubble({ role = 'user', children, style }) {
  const isUser = role === 'user';
  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '85%',
      padding: '10px 14px',
      borderRadius: 12,
      background: isUser ? BRAND.bgDark : 'transparent',
      border: isUser ? `1px solid ${BRAND.border}` : 'none',
      color: BRAND.text,
      fontSize: 14, lineHeight: 1.5,
      fontWeight: 500,
      ...style,
    }}>{children}</div>
  );
}

// ─── ChatWindow: a mock chat interface frame with header + body + composer.
// Children render inside the message area.
function ChatWindow({ x, y, width = 360, height = 460, title, logoId, accentColor,
  children, scale = 1, opacity = 1, showComposer = true, composerText }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width, height,
      transform: `scale(${scale})`,
      transformOrigin: 'top center',
      opacity,
      background: BRAND.bgCard,
      border: `1px solid ${BRAND.border}`,
      borderRadius: 14,
      boxShadow: '0 30px 60px -20px rgba(28,28,28,0.18), 0 8px 24px -8px rgba(28,28,28,0.08)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: BRAND.font,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${BRAND.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {logoId && <svg width="22" height="22"><use href={`#${logoId}`}/></svg>}
        </div>
        <div style={{
          fontSize: 14, fontWeight: 600, color: BRAND.text,
          letterSpacing: '-0.01em', flex: 1,
        }}>{title}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: BRAND.border }}/>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: BRAND.border }}/>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: BRAND.border }}/>
        </div>
      </div>
      {/* Body */}
      <div style={{
        flex: 1,
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
        overflow: 'hidden',
      }}>{children}</div>
      {/* Composer */}
      {showComposer && (
        <div style={{
          padding: '12px 18px 16px',
          borderTop: `1px solid ${BRAND.border}`,
        }}>
          <div style={{
            padding: '10px 14px',
            background: BRAND.bgBase,
            borderRadius: 20,
            fontSize: 13,
            color: composerText ? BRAND.text : BRAND.textDim,
            fontWeight: 500,
          }}>{composerText || 'Ask anything…'}</div>
        </div>
      )}
    </div>
  );
}

// ─── Fade/slide-in wrapper, driven by time. Use when you don't need a Sprite.
function FadeIn({ start = 0, duration = 0.6, from = 'down', distance = 24,
  children, style = {}, ease = Easing.easeOutCubic }) {
  const t = useTime();
  const local = clamp((t - start) / duration, 0, 1);
  const eased = ease(local);
  const tx = from === 'left' ? -distance * (1 - eased)
    : from === 'right' ? distance * (1 - eased) : 0;
  const ty = from === 'up' ? -distance * (1 - eased)
    : from === 'down' ? distance * (1 - eased) : 0;
  return (
    <div style={{
      ...style,
      opacity: eased,
      transform: `translate(${tx}px, ${ty}px)`,
      willChange: 'transform, opacity',
    }}>{children}</div>
  );
}

// ─── Mock browser/desktop window chrome ───────────────────────────────────
function DesktopFrame({ x, y, width, height, title, children, opacity = 1, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width, height,
      transform: `scale(${scale})`, transformOrigin: 'top left',
      opacity,
      background: BRAND.bgCard,
      border: `1px solid ${BRAND.border}`,
      borderRadius: 8,
      boxShadow: '0 30px 60px -20px rgba(28,28,28,0.18)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 32, background: BRAND.bgDark,
        borderBottom: `1px solid ${BRAND.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: '#ff5f57' }}/>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: '#febc2e' }}/>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: '#28c840' }}/>
        </div>
        <div style={{
          flex: 1, textAlign: 'center',
          fontSize: 12, color: BRAND.textMuted, fontWeight: 500,
          letterSpacing: '0.02em',
        }}>{title}</div>
        <div style={{ width: 40 }}/>
      </div>
      <div style={{ flex: 1, padding: 20, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

// ─── Logo wordmark for top-left chrome
function Wordmark({ x, y }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: BRAND.font, fontSize: 17, fontWeight: 700,
      letterSpacing: '-0.02em', color: BRAND.text,
    }}>
      <span style={{ color: BRAND.accent, fontWeight: 800 }}>Sample</span>
      <span style={{ fontWeight: 400, marginLeft: 4, color: BRAND.textMuted, fontSize: 15 }}>Academy</span>
    </div>
  );
}

// ─── Progress dots showing scene progression
function SceneProgress({ scenes, current, x, y }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      display: 'flex', gap: 6,
    }}>
      {scenes.map((_, i) => (
        <div key={i} style={{
          width: i === current ? 22 : 6, height: 6,
          borderRadius: 4,
          background: i === current ? BRAND.accent
            : i < current ? 'rgba(139,38,53,0.5)' : BRAND.borderStrong,
          transition: 'width 0.3s ease, background 0.3s ease',
        }}/>
      ))}
    </div>
  );
}

// ─── Counts up a number from 0 to target across a window.
function CountUp({ from = 0, to, start = 0, duration = 1.2, suffix = '', ease = Easing.easeOutCubic, style }) {
  const t = useTime();
  const local = clamp((t - start) / duration, 0, 1);
  const v = Math.round(from + (to - from) * ease(local));
  return <span style={style}>{v}{suffix}</span>;
}

// ─── Big section title used at start of each scene
function SceneTitle({ eyebrow, title, x, y, start = 0, eyebrowColor = BRAND.accent, color = BRAND.text }) {
  return (
    <>
      <FadeIn start={start} duration={0.5} from="down" distance={14}
        style={{ position: 'absolute', left: x, top: y }}>
        <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      </FadeIn>
      <FadeIn start={start + 0.18} duration={0.6} from="down" distance={20}
        style={{ position: 'absolute', left: x, top: y + 38 }}>
        <div style={{
          fontFamily: BRAND.font, fontSize: 64, fontWeight: 700,
          letterSpacing: '-0.025em', lineHeight: 1.02, color,
          maxWidth: 1100,
        }}>{title}</div>
      </FadeIn>
    </>
  );
}

// ─── Cursor (mouse pointer) that moves between coordinates
function Cursor({ keyframes, start = 0, color = BRAND.text }) {
  // keyframes: [{ t: seconds-from-start, x, y }]
  const t = useTime();
  const local = t - start;
  let x = keyframes[0].x, y = keyframes[0].y, opacity = 0;
  if (local >= 0) {
    opacity = 1;
    for (let i = 0; i < keyframes.length - 1; i++) {
      const a = keyframes[i], b = keyframes[i + 1];
      if (local >= a.t && local <= b.t) {
        const u = (local - a.t) / (b.t - a.t);
        const eu = Easing.easeInOutCubic(u);
        x = a.x + (b.x - a.x) * eu;
        y = a.y + (b.y - a.y) * eu;
        break;
      }
    }
    if (local >= keyframes[keyframes.length - 1].t) {
      x = keyframes[keyframes.length - 1].x;
      y = keyframes[keyframes.length - 1].y;
    }
  }
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{
      position: 'absolute', left: x, top: y, opacity,
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
      pointerEvents: 'none', zIndex: 50,
    }}>
      <path d="M2 2 L2 16 L6 12 L9 18 L11 17 L8 11 L13 11 Z"
        fill={BRAND.bgCard} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

Object.assign(window, {
  BRAND, Eyebrow, TypeOn, Pinwheel, Tether, ChatBubble, ChatWindow,
  FadeIn, DesktopFrame, Wordmark, SceneProgress, CountUp, SceneTitle, Cursor,
});
