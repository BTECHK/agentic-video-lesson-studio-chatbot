import { execSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// --- Types ---

export interface VideoMetadata {
  fileSize: number;
  width: number;
  height: number;
  fps: number;
  duration: number;
}

export interface CheckResult {
  passed: boolean;
  [key: string]: unknown;
}

export interface ValidationResult {
  passed: boolean;
  timestamp: string;
  checks: {
    fileSize: CheckResult;
    resolution: CheckResult;
    fps: CheckResult;
    blankFrames: CheckResult;
    fontRendering: CheckResult;
    duration: CheckResult;
  };
}

// --- Constants ---

const FILE_SIZE_LIMIT = 1_932_735_283; // 1.8GB in bytes
const REQUIRED_WIDTH = 1920;
const REQUIRED_HEIGHT = 1080;
const REQUIRED_FPS = 30;
const DURATION_TOLERANCE = 0.5; // seconds
const BLANK_FRAME_THRESHOLD = 0.997; // 99.7% same color = blank (allows small elements like motion circles)
const FONT_STDDEV_THRESHOLD = 25;

// Shell metacharacter pattern for path sanitization (T-01-06)
// Defense-in-depth only — blocks common injection chars but is not exhaustive.
// The real mitigation is quoting the path in the ffprobe command and never
// passing untrusted user input to shell exec in production.
const SHELL_METACHAR_PATTERN = /[;|&$`]/;

// --- Individual Validators ---

export function validateFileSize(fileSize: number): CheckResult {
  const passed = fileSize < FILE_SIZE_LIMIT;
  return passed
    ? { passed: true }
    : { passed: false, value: fileSize, limit: FILE_SIZE_LIMIT };
}

export function validateResolution(width: number, height: number): CheckResult {
  const passed = width === REQUIRED_WIDTH && height === REQUIRED_HEIGHT;
  return { passed, width, height };
}

export function validateFps(fps: number): CheckResult {
  const passed = fps === REQUIRED_FPS;
  return { passed, value: fps };
}

export function validateDuration(
  actual: number,
  expected: number,
): CheckResult {
  const passed = Math.abs(actual - expected) <= DURATION_TOLERANCE;
  return passed
    ? { passed: true }
    : { passed: false, actual, expected };
}

// --- Image Analysis ---

export async function detectBlankFrame(imagePath: string): Promise<boolean> {
  const { data, info } = await sharp(imagePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalPixels = info.width * info.height;
  const channels = info.channels;

  // Count pixels matching the first pixel's color
  const refR = data[0];
  const refG = data[1];
  const refB = data[2];

  let matchCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * channels;
    if (
      data[offset] === refR &&
      data[offset + 1] === refG &&
      data[offset + 2] === refB
    ) {
      matchCount++;
    }
  }

  return matchCount / totalPixels >= BLANK_FRAME_THRESHOLD;
}

export async function verifyFontRendering(
  imagePath: string,
): Promise<boolean> {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const w = metadata.width!;
  const h = metadata.height!;

  // Crop center 50% region (25% from each edge)
  const cropLeft = Math.floor(w * 0.25);
  const cropTop = Math.floor(h * 0.25);
  const cropWidth = Math.floor(w * 0.5);
  const cropHeight = Math.floor(h * 0.5);

  const { data, info } = await sharp(imagePath)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const totalPixels = info.width * info.height;

  // Compute per-channel mean
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * channels;
    sumR += data[offset];
    sumG += data[offset + 1];
    sumB += data[offset + 2];
  }
  const meanR = sumR / totalPixels;
  const meanG = sumG / totalPixels;
  const meanB = sumB / totalPixels;

  // Compute per-channel standard deviation
  let varR = 0;
  let varG = 0;
  let varB = 0;
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * channels;
    varR += (data[offset] - meanR) ** 2;
    varG += (data[offset + 1] - meanG) ** 2;
    varB += (data[offset + 2] - meanB) ** 2;
  }
  const stddevR = Math.sqrt(varR / totalPixels);
  const stddevG = Math.sqrt(varG / totalPixels);
  const stddevB = Math.sqrt(varB / totalPixels);

  // Average stddev across channels
  const avgStddev = (stddevR + stddevG + stddevB) / 3;

  return avgStddev > FONT_STDDEV_THRESHOLD;
}

// --- Metadata Extraction ---

export function extractMetadata(filePath: string): VideoMetadata {
  if (SHELL_METACHAR_PATTERN.test(filePath)) {
    throw new Error(
      `Invalid file path: contains shell metacharacters: ${filePath}`,
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let probeOutput: string;
  try {
    probeOutput = execSync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
      { encoding: 'utf-8' },
    );
  } catch {
    throw new Error('ffprobe not found -- is FFmpeg installed?');
  }

  const probe = JSON.parse(probeOutput);
  const videoStream = probe.streams?.find(
    (s: { codec_type: string }) => s.codec_type === 'video',
  );

  const fileSize = parseInt(probe.format?.size ?? '0', 10);
  const width = videoStream?.width ?? 0;
  const height = videoStream?.height ?? 0;
  const duration = parseFloat(probe.format?.duration ?? '0');

  // Parse fps from r_frame_rate (e.g., "30/1" -> 30)
  let fps = 0;
  const frameRate = videoStream?.r_frame_rate;
  if (frameRate) {
    const parts = frameRate.split('/');
    fps =
      parts.length === 2
        ? parseInt(parts[0], 10) / parseInt(parts[1], 10)
        : parseFloat(frameRate);
  }

  return { fileSize, width, height, fps, duration };
}

// --- Pipeline ---

export async function validateRender(
  mp4Path: string,
  screenshotsDir: string,
  expectedDurationSeconds: number,
): Promise<ValidationResult> {
  const result: ValidationResult = {
    passed: false,
    timestamp: new Date().toISOString(),
    checks: {
      fileSize: { passed: false },
      resolution: { passed: false },
      fps: { passed: false },
      blankFrames: { passed: true },
      fontRendering: { passed: false },
      duration: { passed: false },
    },
  };

  // Extract metadata
  let metadata: VideoMetadata | null = null;
  try {
    metadata = extractMetadata(mp4Path);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Unknown error extracting metadata';
    result.checks.fileSize = { passed: false, error: msg };
    result.checks.resolution = { passed: false, error: msg };
    result.checks.fps = { passed: false, error: msg };
    result.checks.duration = { passed: false, error: msg };
  }

  if (metadata) {
    result.checks.fileSize = validateFileSize(metadata.fileSize);
    result.checks.resolution = validateResolution(
      metadata.width,
      metadata.height,
    );
    result.checks.fps = validateFps(metadata.fps);
    result.checks.duration = validateDuration(
      metadata.duration,
      expectedDurationSeconds,
    );
  }

  // Check screenshots for blank frames and font rendering
  let screenshots: string[] = [];
  try {
    if (fs.existsSync(screenshotsDir)) {
      screenshots = fs
        .readdirSync(screenshotsDir)
        .filter((f) => f.endsWith('.png'))
        .map((f) => path.join(screenshotsDir, f));
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  // Blank frame detection
  if (screenshots.length > 0) {
    let blankCount = 0;
    for (const screenshot of screenshots) {
      if (await detectBlankFrame(screenshot)) {
        blankCount++;
      }
    }
    result.checks.blankFrames = {
      passed: blankCount === 0,
      blankCount,
      totalChecked: screenshots.length,
    };
  }
  // If no screenshots, blankFrames passes (no frames to check per spec)

  // Font rendering verification
  if (screenshots.length > 0) {
    let fontPassed = false;
    for (const screenshot of screenshots) {
      if (await verifyFontRendering(screenshot)) {
        fontPassed = true;
        break;
      }
    }
    result.checks.fontRendering = { passed: fontPassed };
  } else {
    result.checks.fontRendering = { passed: false, error: 'No screenshots to verify' };
  }

  // Overall result
  result.passed = Object.values(result.checks).every((c) => c.passed);

  // Write report
  const reportDir = path.join(process.cwd(), 'output/validation');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'report.json'),
    JSON.stringify(result, null, 2),
  );

  return result;
}

// --- CLI Entry Point ---

if (require.main === module) {
  const [mp4Path, screenshotsDir, expectedDuration] = process.argv.slice(2);

  if (!mp4Path || !screenshotsDir || !expectedDuration) {
    console.error(
      'Usage: node scripts/verify.js <mp4-path> <screenshots-dir> <expected-duration-seconds>',
    );
    process.exit(1);
  }

  validateRender(mp4Path, screenshotsDir, parseFloat(expectedDuration))
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
