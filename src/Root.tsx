import React from 'react';
import { Composition } from 'remotion';
import { BrandShowcase } from './compositions/BrandShowcase';
import { PlatformWalkthrough } from './compositions/PlatformWalkthrough';
import { LessonVideo, lessonMetadata, type LessonVideoProps } from './compositions/LessonVideo';
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
        durationInFrames={1800}
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
    </>
  );
};
