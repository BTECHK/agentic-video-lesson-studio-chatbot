import fs from 'fs';
import path from 'path';

export interface GalleryScene {
  name: string;
  frames: { frameNumber: number; filename: string }[];
}

export function generateGallery(
  scenes: GalleryScene[],
  validationReport: Record<string, unknown> | null,
  outputPath?: string,
): string {
  const sceneBlocks = scenes
    .map(
      (scene) => `
    <div class="scene">
      <h2>${scene.name}</h2>
      <div class="frames">
        ${scene.frames
          .map(
            (f) => `
          <div class="frame">
            <img src="screenshots/${f.filename}" alt="${scene.name} Frame ${f.frameNumber}" />
            <label>Frame ${f.frameNumber}</label>
          </div>`,
          )
          .join('')}
      </div>
      <div class="storyboard-slot" data-storyboard="placeholder"></div>
    </div>`,
    )
    .join('');

  const validationSection = validationReport
    ? `<div class="validation">
      <h2>Validation Results</h2>
      <pre>${JSON.stringify(validationReport, null, 2)}</pre>
    </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Render Verification</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f5f5f5; padding: 2rem; margin: 0; }
    h1 { margin-top: 0; }
    .scene { margin-bottom: 2rem; border: 1px solid #ddd; padding: 1rem; background: white; border-radius: 4px; }
    .scene h2 { margin-top: 0; }
    .frames { display: flex; gap: 1rem; flex-wrap: wrap; }
    .frame { text-align: center; }
    .frame img { max-width: 400px; border: 1px solid #eee; display: block; }
    .frame label { display: block; font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
    .storyboard-slot { display: none; }
    .validation { padding: 1rem; margin-top: 1rem; border: 1px solid #ddd; background: white; border-radius: 4px; }
    .validation pre { overflow-x: auto; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Render Verification</h1>
  ${sceneBlocks}
  ${validationSection}
</body>
</html>`;

  if (outputPath) {
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, html, 'utf-8');
  }

  return html;
}
