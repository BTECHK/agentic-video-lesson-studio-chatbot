import React from 'react';
import { Composition } from 'remotion';
import { BrandShowcase } from './compositions/BrandShowcase';
import { BRAND } from './brand/tokens';

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
    </>
  );
};
