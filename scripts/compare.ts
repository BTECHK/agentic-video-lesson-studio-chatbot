import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs';
import path from 'path';

export interface ComparisonResult {
  match: boolean;
  diffPixels: number;
  totalPixels: number;
  diffPercent: number;
}

export function compareFrames(
  actualPath: string,
  referencePath: string,
  threshold: number = 0.001, // 0.1% overall pixel diff tolerance (D-10)
): ComparisonResult {
  const actualData = fs.readFileSync(actualPath);
  const referenceData = fs.readFileSync(referencePath);

  const actual = PNG.sync.read(actualData);
  const reference = PNG.sync.read(referenceData);

  // Guard: pixelmatch requires identical dimensions
  if (actual.width !== reference.width || actual.height !== reference.height) {
    return {
      match: false,
      diffPixels: -1,
      totalPixels: -1,
      diffPercent: 1,
    };
  }

  const { width, height } = actual;
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    actual.data,
    reference.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }, // per-pixel color distance threshold
  );

  const totalPixels = width * height;
  const diffPercent = totalPixels > 0 ? diffPixels / totalPixels : 0;

  return {
    match: diffPercent <= threshold,
    diffPixels,
    totalPixels,
    diffPercent,
  };
}

export function compareAllFrames(
  screenshotsDir: string,
  referencesDir: string,
  threshold?: number,
): { allMatch: boolean; results: Record<string, ComparisonResult> } {
  const files = fs
    .readdirSync(screenshotsDir)
    .filter((f) => f.endsWith('.png'));

  const results: Record<string, ComparisonResult> = {};
  let allMatch = true;

  for (const file of files) {
    const refPath = fs.existsSync(
      path.join(referencesDir, file),
    )
      ? path.join(referencesDir, file)
      : null;

    if (!refPath) continue;

    const result = compareFrames(
      path.join(screenshotsDir, file),
      refPath,
      threshold,
    );
    results[file] = result;

    if (!result.match) {
      allMatch = false;
    }
  }

  return { allMatch, results };
}
