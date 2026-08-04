import React from 'react';
import { Composition } from 'remotion';
import { BrandShowcase } from './compositions/BrandShowcase';
import { PlatformWalkthrough } from './compositions/PlatformWalkthrough';
import { LessonVideo, lessonMetadata, type LessonVideoProps } from './compositions/LessonVideo';
import { SizzleReel, sizzleReelMetadata, type SizzleReelProps } from './compositions/SizzleReel';
import { SizzleManifesto, sizzleManifestoMetadata, type SizzleManifestoProps } from './compositions/SizzleManifesto';
import { BRAND } from './brand/tokens';
import module1Lesson from '../content/lessons/module-1/lesson.json';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="BrandShowcase"
        component={BrandShowcase}
        durationInFrames={300}
        fps={BRAND.video.fps}
        width={BRAND.video.width}
        height={BRAND.video.height}
      />
      <Composition
        id="PlatformWalkthrough"
        component={PlatformWalkthrough}
        durationInFrames={2340}
        fps={BRAND.video.fps}
        width={BRAND.video.width}
        height={BRAND.video.height}
      />
      <Composition
        id="LessonVideo"
        component={LessonVideo}
        fps={BRAND.video.fps}
        width={BRAND.video.width}
        height={BRAND.video.height}
        defaultProps={{ lesson: module1Lesson as unknown as LessonVideoProps['lesson'] }}
        calculateMetadata={lessonMetadata}
      />
      <Composition
        id="SizzleReel"
        component={SizzleReel}
        fps={BRAND.video.fps}
        width={BRAND.video.width}
        height={BRAND.video.height}
        defaultProps={{ format: '16:9' } as SizzleReelProps}
        calculateMetadata={sizzleReelMetadata}
      />
      <Composition
        id="SizzleManifesto"
        component={SizzleManifesto}
        fps={BRAND.video.fps}
        width={BRAND.video.width}
        height={BRAND.video.height}
        defaultProps={{ format: '16:9' } as SizzleManifestoProps}
        calculateMetadata={sizzleManifestoMetadata}
      />
    </>
  );
};
