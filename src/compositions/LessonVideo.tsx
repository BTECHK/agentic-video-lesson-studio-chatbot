import React from 'react';
import { AbsoluteFill, Series, Audio, staticFile, type CalculateMetadataFunction } from 'remotion';
import { BRAND } from '../brand/tokens';
import { LessonSchema, type Lesson } from '../../content/schemas/lesson';
import { getSceneComponent } from '../lib/scene-dispatcher';
import type { SceneComponentProps } from '../lib/scene-types';
import { registerLessonScenes } from './lesson-scenes/register';
import { fontFamily } from './lesson-scenes/shared';
import { LessonCaptions } from './lesson-scenes/LessonCaptions';
import { LayoutProbe } from './lesson-scenes/LayoutProbe';

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
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.colors.bgBase }}>
      <Series>
        {lesson.scenes.map((scene) => {
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
          };
          const narration = scene.narration;
          return (
            <Series.Sequence key={scene.id} durationInFrames={scene.duration}>
              {Component ? <Component {...props} /> : <MissingScene type={scene.type} />}
              {narration?.audioSrc ? <Audio src={staticFile(narration.audioSrc)} /> : null}
              {narration?.words?.length ? <LessonCaptions words={narration.words} /> : null}
            </Series.Sequence>
          );
        })}
      </Series>
      {layoutProbe === true ? <LayoutProbe /> : null}
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
