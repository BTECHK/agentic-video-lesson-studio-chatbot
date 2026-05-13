import React from 'react';
import { Sequence } from 'remotion';
import { TypographyScene } from './scenes/TypographyScene';
import { BrandElementsScene } from './scenes/BrandElementsScene';
import { MotionTestScene } from './scenes/MotionTestScene';

export const BrandShowcase: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={90}>
        <TypographyScene />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <BrandElementsScene />
      </Sequence>
      <Sequence from={180} durationInFrames={120}>
        <MotionTestScene />
      </Sequence>
    </>
  );
};
