import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { SCENES, getScreenshotFrames } from './render';
import { validateRender } from './verify';
import { generateGallery, type GalleryScene } from './gallery';
import { compareAllFrames } from './compare';

const COMPOSITION_ID = 'BrandShowcase';
const EXPECTED_DURATION = 10; // seconds (300 frames / 30fps)

export interface PipelineResult {
  renderCompleted: boolean;
  validationPassed: boolean;
  galleryGenerated: boolean;
  determinismChecked: boolean;
  outputPaths: {
    video: string;
    gallery: string;
    validationReport: string;
  };
}

export async function runPipeline(options?: {
  skipDeterminism?: boolean;
  referencesDir?: string;
}): Promise<PipelineResult> {
  const videoPath = path.join(process.cwd(), 'output/video/brand-showcase.mp4');
  const galleryPath = path.join(process.cwd(), 'output/verification/index.html');
  const reportPath = path.join(process.cwd(), 'output/validation/report.json');
  const screenshotsDir = path.join(process.cwd(), 'output/verification/screenshots');

  const result: PipelineResult = {
    renderCompleted: false,
    validationPassed: false,
    galleryGenerated: false,
    determinismChecked: false,
    outputPaths: { video: videoPath, gallery: galleryPath, validationReport: reportPath },
  };

  // Ensure output directories exist
  for (const dir of ['output/video', 'output/verification/screenshots', 'output/validation']) {
    fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
  }

  // Step 1: Render
  console.log('[pipeline] Bundling project...');
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), 'src/index.ts'),
  });

  const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID });

  console.log('[pipeline] Capturing screenshots...');
  for (const scene of SCENES) {
    const frames = getScreenshotFrames(scene);
    for (const frame of frames) {
      await renderStill({
        composition,
        serveUrl,
        output: path.join(screenshotsDir, `${scene.name}-frame-${frame}.png`),
        frame,
        imageFormat: 'png',
      });
    }
  }

  console.log('[pipeline] Rendering MP4...');
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: videoPath,
    chromiumOptions: { enableMultiProcessOnLinux: true },
  });

  result.renderCompleted = true;

  // Step 2: Validate
  console.log('[pipeline] Validating render output...');
  const validation = await validateRender(videoPath, screenshotsDir, EXPECTED_DURATION);
  result.validationPassed = validation.passed;

  // Step 3: Gallery (always generated, even on validation failure -- for debugging)
  console.log('[pipeline] Generating verification gallery...');
  const galleryScenes: GalleryScene[] = SCENES.map((scene) => {
    const frames = getScreenshotFrames(scene);
    return {
      name: scene.name,
      frames: frames.map((f) => ({
        frameNumber: f,
        filename: `${scene.name}-frame-${f}.png`,
      })),
    };
  });

  generateGallery(galleryScenes, validation as unknown as Record<string, unknown>, galleryPath);
  result.galleryGenerated = true;

  // Exit non-zero on validation failure (VERI-04), after gallery is generated
  if (!validation.passed) {
    console.error('[pipeline] Validation FAILED. Gallery generated for review.');
    return result;
  }

  // Step 4: Deterministic comparison (optional)
  if (!options?.skipDeterminism && options?.referencesDir) {
    if (fs.existsSync(options.referencesDir)) {
      console.log('[pipeline] Running deterministic frame comparison...');
      const comparison = compareAllFrames(screenshotsDir, options.referencesDir);
      result.determinismChecked = true;

      if (!comparison.allMatch) {
        console.warn('[pipeline] Some frames differ from reference snapshots:');
        for (const [file, res] of Object.entries(comparison.results)) {
          if (!res.match) {
            console.warn(`  ${file}: ${(res.diffPercent * 100).toFixed(2)}% diff`);
          }
        }
      } else {
        console.log('[pipeline] All frames match reference snapshots.');
      }
    }
  }

  console.log('[pipeline] Pipeline complete.');
  return result;
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const skipDeterminism = args.includes('--skip-determinism');
  const refIdx = args.indexOf('--references');
  const referencesDir = refIdx >= 0 ? args[refIdx + 1] : undefined;

  runPipeline({ skipDeterminism, referencesDir })
    .then((result) => {
      if (!result.validationPassed) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
