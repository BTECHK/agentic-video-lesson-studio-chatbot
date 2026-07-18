import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { ScreenFlowContent } from './content-types';
import { BRAND, SHADOW, MOTION } from '../../brand/tokens';
import {
  MUTED,
  HAIRLINE,
  SceneFrame,
  Eyebrow,
  renderAccented,
  useGlideIn,
  usePopIn,
  sceneTitleStyle,
  SimDisclaimer,
} from './shared';

// Extra frames added per action type on top of `dwell * fps`.
function actionExtra(action: string, typedText: string | undefined): number {
  if (action === 'click') return 12;
  if (action === 'type') return Math.max((typedText?.length ?? 0) * 2, 20);
  if (action === 'navigate') return 18;
  if (action === 'reveal') return 8;
  return 0;
}

// 5+ steps otherwise stack past the frame bottom / under the caption band
// (defect: a bonus scene reveal stack clipped + its last badge
// card overlapping caption words). Tightening block/panel whitespace is
// whitespace-only — never smaller step text. Shared by FullPanel (below) and
// the split-layout PreviewPanel/RevealBlock.
const LONG_STEP_LIST = 5;

// 8+ steps in a `full`-layout FullPanel — where ALL steps stay mounted
// simultaneously regardless of the current playback frame — still overflow
// past the LONG_STEP_LIST compaction alone (defect: a full-layout scene, 8
// steps, its last row overlapping the pagination scene-counter by 18x14px).
// One tier deeper, FullPanel only: no PreviewPanel/RevealBlock scene in the
// corpus reaches this count (max reveal-only stack is 5, already covered by
// LONG_STEP_LIST).
const VERY_LONG_STEP_LIST = 8;

/**
 * `screen-flow` — an animated mock browser/desktop window that walks through a
 * sequence of UI interactions: clicks, typed input, navigation, and staged UI
 * state reveals. Use for step-by-step tool walkthroughs ("Build a Custom GPT")
 * without any screen recording.
 *
 * Outputs are clearly stylized representations — never a fabricated real
 * screenshot. The window chrome is generic cartoon chrome; no vendor logos,
 * colors, or proprietary UI elements are reproduced.
 */
export const ScreenFlow: React.FC<SceneComponentProps> = ({ scene, showSimDisclaimer }) => {
  const c = scene.content as unknown as ScreenFlowContent;
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const title = useGlideIn(10, 22);
  const win = useGlideIn(28, 36);
  const caption = useGlideIn(150, 16);

  const durationInFrames = scene.duration;

  // Compute step start frames, clamping overflow steps.
  const stepDurations: number[] = c.steps.map((step) =>
    Math.floor(step.dwell * fps) + actionExtra(step.action, step.typedText),
  );

  const stepStartFrames: number[] = [];
  let acc = 0;
  let overflowed = false;
  for (let i = 0; i < stepDurations.length; i++) {
    if (acc >= durationInFrames - 1) {
      if (!overflowed && process.env.NODE_ENV !== 'production') {
        console.warn(
          `[ScreenFlow] scene "${scene.id}": step ${i} overflows durationInFrames (${durationInFrames}). Steps beyond this point are elided.`,
        );
        overflowed = true;
      }
      stepStartFrames.push(durationInFrames); // elided — never active
    } else {
      stepStartFrames.push(acc);
    }
    acc += stepDurations[i];
  }

  // Determine active step index.
  let activeStep = c.steps.length - 1; // freeze on final step after all complete
  for (let i = 0; i < c.steps.length; i++) {
    const start = stepStartFrames[i];
    const end = i + 1 < c.steps.length ? stepStartFrames[i + 1] : durationInFrames;
    if (frame >= start && frame < end) {
      activeStep = i;
      break;
    }
  }

  return (
    <SceneFrame align="flex-start" paddingX={120}>
      <Eyebrow delay={4}>{c.eyebrow}</Eyebrow>
      <h1 style={{ ...title, ...sceneTitleStyle(54) }}>{renderAccented(c.title)}</h1>

      <div
        style={{
          ...win,
          width: '100%',
          backgroundColor: BRAND.colors.bgCard,
          border: `1px solid ${BRAND.colors.border}`,
          borderRadius: BRAND.radiusWindow,
          boxShadow: SHADOW.window,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <MockBrowserWindow
          c={c}
          frame={frame}
          fps={fps}
          activeStep={activeStep}
          stepStartFrames={stepStartFrames}
          stepDurations={stepDurations}
          durationInFrames={durationInFrames}
          showSimDisclaimer={showSimDisclaimer}
        />
      </div>

      {c.caption && (
        <div
          style={{
            ...caption,
            fontSize: 22,
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

// ---------------------------------------------------------------------------
// MockBrowserWindow
// ---------------------------------------------------------------------------

interface MockBrowserWindowProps {
  c: ScreenFlowContent;
  frame: number;
  fps: number;
  activeStep: number;
  stepStartFrames: number[];
  stepDurations: number[];
  durationInFrames: number;
  showSimDisclaimer?: boolean;
}

const MockBrowserWindow: React.FC<MockBrowserWindowProps> = ({
  c,
  frame,
  fps,
  activeStep,
  stepStartFrames,
  stepDurations,
  durationInFrames,
  showSimDisclaimer,
}) => {
  const leftBg = c.fidelity === 'hybrid' ? 'rgba(28,28,28,0.05)' : BRAND.colors.bgCard;
  const long = c.steps.length >= LONG_STEP_LIST;

  return (
    <div style={{ width: '100%' }}>
      {/* Chrome bar */}
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: `1px solid ${BRAND.colors.border}`,
          gap: 16,
        }}
      >
        {/* Traffic-light dots — decorative, skipped by LayoutProbe */}
        <div data-decor style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: HAIRLINE, display: 'block' }}
            />
          ))}
        </div>
        {/* Fake URL bar */}
        <div
          style={{
            flex: 1,
            height: 28,
            borderRadius: BRAND.radius,
            backgroundColor: `rgba(28,28,28,0.08)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: MUTED,
            fontWeight: BRAND.font.weights.regular,
          }}
        >
          {c.windowTitle}
        </div>
        {/* Honesty chip baked into the chrome — every screen-flow inherits it
            regardless of whether the content sets `caption`. */}
        {showSimDisclaimer !== false && <SimDisclaimer />}
      </div>

      {/* Body */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          minHeight: 380,
          position: 'relative',
        }}
      >
        {c.layout === 'split' ? (
          <>
            {/* Left form panel */}
            <div
              style={{
                flex: '0 0 44%',
                backgroundColor: leftBg,
                borderRight: `1px solid ${BRAND.colors.border}`,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <FormPanel c={c} frame={frame} fps={fps} activeStep={activeStep} stepStartFrames={stepStartFrames} />
            </div>
            {/* Right preview panel */}
            <div
              style={{
                flex: 1,
                backgroundColor: BRAND.colors.bgCard,
                padding: long ? 16 : 24,
                display: 'flex',
                flexDirection: 'column',
                gap: long ? 8 : 16,
              }}
            >
              <PreviewPanel c={c} frame={frame} fps={fps} stepStartFrames={stepStartFrames} durationInFrames={durationInFrames} long={long} />
            </div>
          </>
        ) : (
          <FullPanel c={c} frame={frame} fps={fps} activeStep={activeStep} stepStartFrames={stepStartFrames} />
        )}

        {/* Cursor overlay */}
        {c.targetPositions && (
          <MockCursor
            c={c}
            frame={frame}
            fps={fps}
            activeStep={activeStep}
            stepStartFrames={stepStartFrames}
            stepDurations={stepDurations}
          />
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// FormPanel — renders field rows for split layout
// ---------------------------------------------------------------------------

interface PanelProps {
  c: ScreenFlowContent;
  frame: number;
  fps: number;
  activeStep: number;
  stepStartFrames: number[];
}

const FormPanel: React.FC<PanelProps> = ({ c, frame, fps, activeStep, stepStartFrames }) => {
  // Only show fields for 'type' steps
  const typeSteps = c.steps.filter((s) => s.action === 'type');
  const hasClickStep = c.steps.some((s) => s.action === 'click');

  // A split flow with neither 'type' nor 'click' steps (e.g. a code-editor
  // scene that's all navigate/reveal) left this pane permanently blank — no
  // rendering branch admitted those actions. Fall back to the same abstract
  // row treatment used for click steps below, so the editor/file chrome
  // still carries progressive content that tracks the reveal steps the
  // right pane narrates.
  if (typeSteps.length === 0 && !hasClickStep) {
    return (
      <>
        {c.steps.map((step, stepIdx) => {
          const isActive = activeStep === stepIdx;
          const isPast = activeStep > stepIdx;
          return (
            <div
              key={step.id}
              style={{
                borderRadius: BRAND.radius,
                padding: '10px 14px',
                fontSize: 18,
                backgroundColor: isActive
                  ? BRAND.colors.accentSoft
                  : isPast
                  ? 'rgba(28,28,28,0.04)'
                  : BRAND.colors.bgBase,
                border: isActive
                  ? `1px solid ${BRAND.colors.accent}`
                  : `1px solid ${BRAND.colors.border}`,
                color: isActive ? BRAND.colors.accent : BRAND.colors.text,
                fontWeight: isActive ? BRAND.font.weights.bold : BRAND.font.weights.regular,
                boxShadow: isActive ? SHADOW.cardHover : SHADOW.card,
              }}
            >
              {step.label ?? step.target}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      {typeSteps.map((step) => {
        const stepIdx = c.steps.findIndex((s) => s.id === step.id);
        const isActive = activeStep === stepIdx;
        const isPast = activeStep > stepIdx;
        const stepStartF = stepStartFrames[stepIdx] ?? 0;
        const charCount = step.typedText?.length ?? 0;
        // Character-by-character streaming: 2 frames per char
        const charsVisible = isActive
          ? Math.min(charCount, Math.floor((frame - stepStartF) / 2))
          : isPast
          ? charCount
          : 0;
        const displayText = (step.typedText ?? '').slice(0, charsVisible);

        return (
          <div key={step.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: BRAND.font.weights.bold,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: MUTED,
              }}
            >
              {step.label ?? step.target}
            </div>
            <div
              style={{
                borderRadius: BRAND.radius,
                border: isActive
                  ? `2px solid ${BRAND.colors.accent}`
                  : `1px solid ${BRAND.colors.border}`,
                padding: '10px 14px',
                fontSize: 20,
                minHeight: 44,
                color: isPast || isActive ? BRAND.colors.text : MUTED,
                backgroundColor: BRAND.colors.bgBase,
                boxShadow: isActive ? SHADOW.cardHover : SHADOW.card,
              }}
            >
              {displayText || (!isActive && !isPast ? (
                <span style={{ color: MUTED }}>{step.uiState}</span>
              ) : null)}
            </div>
          </div>
        );
      })}

      {/* Other steps shown as abstract UI rows */}
      {c.steps
        .filter((s) => s.action !== 'type')
        .map((step) => {
          const stepIdx = c.steps.findIndex((s) => s.id === step.id);
          const isActive = activeStep === stepIdx;
          const isPast = activeStep > stepIdx;
          if (step.action !== 'click') return null;
          return (
            <div
              key={step.id}
              style={{
                borderRadius: BRAND.radius,
                padding: '10px 14px',
                fontSize: 18,
                backgroundColor: isActive
                  ? BRAND.colors.accentSoft
                  : isPast
                  ? 'rgba(28,28,28,0.04)'
                  : BRAND.colors.bgBase,
                border: isActive
                  ? `1px solid ${BRAND.colors.accent}`
                  : `1px solid ${BRAND.colors.border}`,
                color: isActive ? BRAND.colors.accent : BRAND.colors.text,
                fontWeight: isActive ? BRAND.font.weights.bold : BRAND.font.weights.regular,
                boxShadow: isActive ? SHADOW.cardHover : SHADOW.card,
              }}
            >
              {step.label ?? step.target}
            </div>
          );
        })}
    </>
  );
};

// ---------------------------------------------------------------------------
// PreviewPanel — reveals blocks for 'reveal' steps in split layout
// ---------------------------------------------------------------------------

interface PreviewPanelProps {
  c: ScreenFlowContent;
  frame: number;
  fps: number;
  stepStartFrames: number[];
  durationInFrames: number;
  long?: boolean;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ c, stepStartFrames, long }) => {
  const revealSteps = c.steps
    .map((step, i) => ({ step, i }))
    .filter(({ step }) => step.action === 'reveal');

  // A split flow with no reveal steps (e.g. a pure settings form) would leave the
  // right panel blank, which reads as half-rendered. Show a calm "applied" state
  // so the preview pane always carries weight.
  if (revealSteps.length === 0) {
    return <AppliedState />;
  }

  return (
    <>
      {revealSteps.map(({ step, i }) => (
        <RevealBlock key={step.id} step={step} delay={stepStartFrames[i] ?? 0} long={long} />
      ))}
    </>
  );
};

/** Settled "saved / applied" confirmation for reveal-less split flows. */
const AppliedState: React.FC = () => {
  const pop = usePopIn(40);
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...pop, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            backgroundColor: BRAND.colors.accent,
            color: BRAND.colors.bgBase,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 13 L10 18 L19 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontWeight: BRAND.font.weights.bold, fontSize: 24, color: BRAND.colors.text }}>Saved</div>
        <div style={{ fontSize: 18, color: MUTED }}>Applied across your chats</div>
      </div>
    </div>
  );
};

const RevealBlock: React.FC<{ step: ScreenFlowContent['steps'][number]; delay: number; long?: boolean }> = ({
  step,
  delay,
  long,
}) => {
  const pop = usePopIn(delay);
  // Styled as a finished generated output — accent rule + 'Generated' kicker +
  // the result text as readable content, then a couple of faint body lines — so
  // it reads as produced output, not a skeleton with a developer note under it.
  // `long` (5+ reveal steps stacked in one preview pane) drops the two filler
  // body lines and tightens padding/gap — whitespace-only, never smaller text
  // — so the stack fits above the caption band instead of pushing its last
  // block into it (see LONG_STEP_LIST).
  return (
    <div
      style={{
        ...pop,
        borderRadius: BRAND.radius,
        border: `1px solid ${BRAND.colors.border}`,
        borderLeft: `3px solid ${BRAND.colors.accent}`,
        backgroundColor: BRAND.colors.bgCard,
        padding: long ? '10px 12px' : '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: long ? 6 : 10,
        boxShadow: SHADOW.card,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: BRAND.colors.accent }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: BRAND.font.weights.bold,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: BRAND.colors.accent,
          }}
        >
          Generated
        </span>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: BRAND.font.weights.semiBold,
          color: BRAND.colors.text,
          lineHeight: 1.4,
        }}
      >
        {step.uiState}
      </div>
      {!long && <div style={{ height: 9, width: '88%', borderRadius: 4, backgroundColor: HAIRLINE }} />}
      {!long && <div style={{ height: 9, width: '72%', borderRadius: 4, backgroundColor: HAIRLINE }} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FullPanel — single scrollable panel for 'full' layout
// ---------------------------------------------------------------------------

interface FullPanelProps {
  c: ScreenFlowContent;
  frame: number;
  fps: number;
  activeStep: number;
  stepStartFrames: number[];
}

const FullPanel: React.FC<FullPanelProps> = ({ c, frame, fps, activeStep, stepStartFrames }) => {
  const long = c.steps.length >= LONG_STEP_LIST;
  const veryLong = c.steps.length >= VERY_LONG_STEP_LIST;
  const panelPad = veryLong ? 12 : long ? 16 : 24;
  const listGap = veryLong ? 4 : long ? 6 : 12;
  const rowPad = veryLong ? '6px 16px' : long ? '8px 16px' : '12px 16px';
  return (
    <div
      style={{
        flex: 1,
        padding: panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: listGap,
      }}
    >
      {c.steps.map((step, i) => {
        const isActive = activeStep === i;
        const isPast = activeStep > i;
        const stepStartF = stepStartFrames[i] ?? 0;

        // navigate crossfade: opacity interpolated over 18 frames; skip for step 0
        let opacity = 1;
        if (step.action === 'navigate' && i > 0) {
          opacity = i === 0
            ? 1
            : interpolate(frame, [stepStartF, stepStartF + 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
        }

        // type step: character streaming
        let displayText = step.typedText ?? step.uiState;
        if (step.action === 'type') {
          const charCount = step.typedText?.length ?? 0;
          const charsVisible = isActive
            ? Math.min(charCount, Math.floor((frame - stepStartF) / 2))
            : isPast
            ? charCount
            : 0;
          displayText = (step.typedText ?? '').slice(0, charsVisible) || step.uiState;
        }

        // Answer-reveal rows (`hideUntilActive`) stay blank until their own
        // step is reached — FullPanel otherwise keeps every row's text
        // mounted (just dimmed) regardless of playback frame, which leaks an
        // interactive beat's answer before the pause (Gate C fix).
        const hideBody = step.hideUntilActive && !isActive && !isPast;

        return (
          <div
            key={step.id}
            style={{
              opacity: isActive || isPast ? opacity : 0.35,
              borderRadius: BRAND.radius,
              border: isActive
                ? `1px solid ${BRAND.colors.accent}`
                : `1px solid ${BRAND.colors.border}`,
              padding: rowPad,
              backgroundColor: isActive ? BRAND.colors.accentSoft : BRAND.colors.bgCard,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: isActive ? SHADOW.cardHover : SHADOW.card,
              transform: isActive ? 'translateY(-6px)' : 'none',
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: BRAND.font.weights.bold,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isActive ? BRAND.colors.accent : MUTED,
              }}
            >
              {step.label ?? step.target}
            </div>
            <div style={{ fontSize: 19, color: BRAND.colors.text, lineHeight: 1.4 }}>
              {hideBody ? ' ' : displayText}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MockCursor — spring-glide position, dwell, click pulse, tooltip pill
// ---------------------------------------------------------------------------

interface MockCursorProps {
  c: ScreenFlowContent;
  frame: number;
  fps: number;
  activeStep: number;
  stepStartFrames: number[];
  stepDurations: number[];
}

const MockCursor: React.FC<MockCursorProps> = ({ c, frame, fps, activeStep, stepStartFrames, stepDurations }) => {
  const positions = c.targetPositions!;
  const steps = c.steps;

  // Resolve x/y percentage for a step (fallback 50/50 if not in map)
  function getPos(idx: number): { x: number; y: number } {
    const target = steps[idx]?.target;
    return positions[target ?? ''] ?? { x: 50, y: 50 };
  }

  const prevPos = activeStep > 0 ? getPos(activeStep - 1) : getPos(activeStep);
  const currPos = getPos(activeStep);
  const stepStart = stepStartFrames[activeStep] ?? 0;

  // Spring glide from prev to curr position — single-use cursor-travel config.
  const glideProgress = spring({
    frame: frame - stepStart,
    fps,
    config: { damping: 26, mass: 0.7 },
  });

  const x = interpolate(glideProgress, [0, 1], [prevPos.x, currPos.x]);
  const y = interpolate(glideProgress, [0, 1], [prevPos.y, currPos.y]);

  // Click pulse: fires at dwell frame, ring scales out + fades
  const currentStep = steps[activeStep];
  const dwellFrames = Math.floor((currentStep?.dwell ?? 1) * fps);
  const pulseStartFrame = stepStart + dwellFrames;
  const pulseFrame = frame - pulseStartFrame;
  const pulseProgress = pulseFrame >= 0
    // Single-use click-ring pulse config (fast, springy overshoot).
    ? spring({ frame: pulseFrame, fps, config: { damping: 10, stiffness: 80, mass: 0.5 } })
    : 0;
  const showPulse = currentStep?.action === 'click' && pulseFrame >= 0 && pulseFrame < 20;
  const pulseOpacity = showPulse ? interpolate(pulseProgress, [0, 1], [1, 0], { extrapolateRight: 'clamp' }) : 0;
  const pulseScale = interpolate(pulseProgress, [0, 1], [0.5, 2.5], { extrapolateRight: 'clamp' });

  // Tooltip pill: fades in at step start, fades out just before click pulse.
  // Both fades share one preset (MOTION.cursorTooltip) — the only 2+-site config.
  const tooltipInProgress = spring({ frame: frame - stepStart, fps, config: MOTION.cursorTooltip });
  const tooltipOutProgress = pulseFrame >= 0
    ? spring({ frame: pulseFrame, fps, config: MOTION.cursorTooltip })
    : 0;
  const tooltipOpacity = tooltipInProgress * (1 - tooltipOutProgress);

  return (
    // data-decor on the cursor wrapper so LayoutProbe skips the SVG arrow
    // (the tooltip pill is NOT marked data-decor — it has real authored text)
    <div
      data-decor
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Click pulse ring */}
      {showPulse && (
        <div
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            transform: `translate(-50%, -50%) scale(${pulseScale})`,
            width: 32,
            height: 32,
            borderRadius: 999,
            border: `2px solid ${BRAND.colors.accent}`,
            opacity: pulseOpacity,
          }}
        />
      )}

      {/* Cursor SVG arrow */}
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(0, 0)',
          pointerEvents: 'none',
        }}
      >
        <svg width="20" height="24" viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2 2 L2 20 L7 15 L11 22 L13 20 L9 13 L16 13 Z"
            fill={BRAND.colors.bgBase}
            stroke={BRAND.colors.text}
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Tooltip pill — real authored text, checked by LayoutProbe */}
      {currentStep && (
        <div
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -130%)',
            opacity: tooltipOpacity,
            backgroundColor: BRAND.colors.text,
            color: BRAND.colors.bgBase,
            fontSize: 14,
            fontWeight: BRAND.font.weights.bold,
            padding: '3px 8px',
            borderRadius: BRAND.radius,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {currentStep.label ?? currentStep.target}
        </div>
      )}
    </div>
  );
};
