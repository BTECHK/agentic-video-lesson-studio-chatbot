import React from 'react';
import {
  AbsoluteFill,
  Series,
  Audio,
  staticFile,
  interpolate,
  useCurrentFrame,
  type CalculateMetadataFunction,
} from 'remotion';
import { BRAND, MOTION } from '../brand/tokens';
import { LessonSchema, type Lesson } from '../../content/schemas/lesson';
import { getSceneComponent } from '../lib/scene-dispatcher';
import type { SceneComponentProps } from '../lib/scene-types';
import { registerLessonScenes } from './lesson-scenes/register';
import { fontFamily, MotionProfileContext, exitProgress } from './lesson-scenes/shared';
import { LessonCaptions } from './lesson-scenes/LessonCaptions';
import { LayoutProbe } from './lesson-scenes/LayoutProbe';
import { LessonChrome } from './lesson-scenes/LessonChrome';

registerLessonScenes();

// Index signature satisfies Remotion's `Record<string, unknown>` props
// constraint while still typing `lesson` precisely.
export type LessonVideoProps = {
  lesson: Lesson;
  [key: string]: unknown;
};

/**
 * Data-driven lesson renderer. Reads a validated lesson, lays scenes out on a
 * contiguous timeline with <Series> (one entry per scene `duration`), and
 * dispatches each scene to its registered component by `type`.
 */
export const LessonVideo: React.FC<LessonVideoProps> = ({ lesson, layoutProbe }) => {
  const profile = lesson.lesson.motionProfile ?? 'v3';
  const lastSceneId = lesson.scenes[lesson.scenes.length - 1]?.id;
  const firstSimIndex = firstSimSceneIndex(lesson.scenes);
  return (
    <MotionProfileContext.Provider value={profile}>
      <AbsoluteFill style={{ backgroundColor: BRAND.colors.bgBase }}>
        <Series>
          {lesson.scenes.map((scene, index) => {
            const Component = getSceneComponent(scene.type);
            const props: SceneComponentProps = {
              scene: {
                id: scene.id,
                type: scene.type,
                start: scene.start,
                duration: scene.duration,
                content: scene.content,
                label: scene.label,
              },
              sceneStartFrame: scene.start,
              narrationWords: scene.narration?.words,
              showSimDisclaimer: index === firstSimIndex,
            };
            const narration = scene.narration;
            return (
              <Series.Sequence key={scene.id} durationInFrames={scene.duration}>
                <SceneExitWrapper
                  profile={profile}
                  duration={scene.duration}
                  isLastScene={scene.id === lastSceneId}
                >
                  <SceneZoom zoom={scene.zoom} duration={scene.duration}>
                    {Component ? <Component {...props} /> : <MissingScene type={scene.type} />}
                  </SceneZoom>
                </SceneExitWrapper>
                {narration?.audioSrc ? <Audio src={staticFile(narration.audioSrc)} /> : null}
                {narration?.words?.length ? <LessonCaptions words={narration.words} /> : null}
              </Series.Sequence>
            );
          })}
        </Series>
        <LessonChrome
          scenes={lesson.scenes.map((s) => ({ start: s.start, duration: s.duration, label: s.label }))}
          fallbackLabel={lesson.lesson.brandLabel ?? lesson.lesson.module}
        />
        {layoutProbe === true ? <LayoutProbe /> : null}
      </AbsoluteFill>
    </MotionProfileContext.Provider>
  );
};

/** Scene types that are animated tool simulations (not real captures). */
const SIM_SCENE_TYPES = ['comparison-chats', 'tool-demo', 'screen-flow', 'voice-demo'];

/**
 * Index of the first sim scene in a lesson, or -1 if none. The honesty chip
 * ("Stylized simulation") shows once per lesson — on this scene only — so
 * later sims stay clean. GLOBAL across profiles (a defect-class fix, not a
 * v4 feature).
 */
export function firstSimSceneIndex(scenes: { type: string }[]): number {
  return scenes.findIndex((s) => SIM_SCENE_TYPES.includes(s.type));
}

/**
 * v4-only scene-exit glide: fades + lifts the outgoing scene over its final
 * `MOTION.exit.dur` frames (kills the hard cut at every scene boundary).
 * v3 renders children untouched — zero behavioral change for existing
 * lessons. The lesson's LAST scene never exits (the end card must hold).
 * Wraps only the SceneZoom block, not Audio/LessonCaptions, so narration and
 * captions are unaffected by the visual exit.
 */
const SceneExitWrapper: React.FC<{
  profile: 'v3' | 'v4';
  duration: number;
  isLastScene: boolean;
  children: React.ReactNode;
}> = ({ profile, duration, isLastScene, children }) => {
  const frame = useCurrentFrame();
  if (profile !== 'v4' || isLastScene) return <>{children}</>;
  const p = exitProgress(frame, duration);
  return (
    <AbsoluteFill
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [MOTION.exit.toY, 0])}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/**
 * Optional per-scene Ken Burns zoom (schema-bounded 0.85–1.2). Eases over the
 * full scene with a gentle cubic so motion never reads as a cut; no-op when
 * the scene carries no zoom. Captions render OUTSIDE this wrapper so the
 * narration chip never scales.
 */
const SceneZoom: React.FC<{
  zoom?: { from: number; to: number };
  duration: number;
  children: React.ReactNode;
}> = ({ zoom, duration, children }) => {
  const frame = useCurrentFrame();
  if (!zoom) return <>{children}</>;
  const scale = interpolate(frame, [0, duration], [zoom.from, zoom.to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>
      {children}
    </AbsoluteFill>
  );
};

/** Visible placeholder for a scene type with no registered component yet. */
const MissingScene: React.FC<{ type: string }> = ({ type }) => (
  <AbsoluteFill
    style={{
      backgroundColor: BRAND.colors.bgBase,
      fontFamily,
      color: BRAND.colors.accent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 40,
      fontWeight: BRAND.font.weights.bold,
    }}
  >
    {`No component registered for "${type}"`}
  </AbsoluteFill>
);

/**
 * Compute duration/dimensions from the lesson data. `lesson.duration` is the
 * contiguous timeline length in frames (validated by LessonSchema). Re-parses
 * defensively so the render path never trusts unvalidated props.
 */
export const lessonMetadata: CalculateMetadataFunction<LessonVideoProps> = ({ props }) => {
  const lesson = LessonSchema.parse(props.lesson);
  return {
    durationInFrames: lesson.lesson.duration,
    width: BRAND.video.width,
    height: BRAND.video.height,
    fps: BRAND.video.fps,
    // Spread preserves pass-through flags (e.g. gate:layout's `layoutProbe`).
    props: { ...props, lesson },
  };
};
