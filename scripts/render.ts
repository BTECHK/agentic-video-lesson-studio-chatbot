import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

const COMPOSITION_ID = 'BrandShowcase';

export const SCENES = [
  { name: 'typography', startFrame: 0, endFrame: 89 },
  { name: 'brand-elements', startFrame: 90, endFrame: 179 },
  { name: 'motion-test', startFrame: 180, endFrame: 299 },
] as const;

export function getScreenshotFrames(
  scene: (typeof SCENES)[number],
): number[] {
  const start = scene.startFrame;
  const end = scene.endFrame;
  const duration = end - start + 1;
  const mid = start + Math.floor(duration / 2);
  return [start, mid, end];
}

export function getScreenshotPath(sceneName: string, frame: number): string {
  return path.join(
    process.cwd(),
    `output/verification/screenshots/${sceneName}-frame-${frame}.png`,
  );
}

async function render() {
  const outputDirs = [
    'output/video',
    'output/verification/screenshots',
    'output/validation',
  ];
  for (const dir of outputDirs) {
    fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
  }

  console.log('Bundling...');
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), 'src/index.ts'),
  });

  console.log('Selecting composition...');
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
  });

  console.log('Capturing screenshots...');
  for (const scene of SCENES) {
    const frames = getScreenshotFrames(scene);
    for (const frame of frames) {
      const output = getScreenshotPath(scene.name, frame);
      await renderStill({
        composition,
        serveUrl,
        output,
        frame,
        imageFormat: 'png',
      });
      console.log(`  Captured ${scene.name} frame ${frame}`);
    }
  }

  console.log('Rendering MP4...');
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: path.join(process.cwd(), 'output/video/brand-showcase.mp4'),
    chromiumOptions: {
      enableMultiProcessOnLinux: true,
    },
  });

  console.log('Complete.');
}

// Run only when executed directly (not imported by tests)
if (require.main === module) {
  render().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
