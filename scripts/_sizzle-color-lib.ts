/**
 * THROWAWAY color helpers for the sizzle verify gate (sRGB→Lab, CIE2000 ΔE, HSL,
 * PNG patch sampling). Shared by `_sizzle-icon-check.ts`, `_sizzle-float-check.ts`,
 * `_sizzle-color-de.ts`. Delete with them once the task is verified.
 */
import { PNG } from 'pngjs';
import fs from 'node:fs';

export type RGB = { r: number; g: number; b: number };

export function readPng(file: string): PNG {
  return PNG.sync.read(fs.readFileSync(file));
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function rgbToLab({ r, g, b }: RGB): [number, number, number] {
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** CIE2000 ΔE between two sRGB colors. */
export function deltaE2000(a: RGB, b: RGB): number {
  const [L1, a1, b1] = rgbToLab(a);
  const [L2, a2, b2] = rgbToLab(b);
  const avgLp = (L1 + L2) / 2;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const avgCp = (C1p + C2p) / 2;
  const hp = (ap: number, bp: number) => {
    if (ap === 0 && bp === 0) return 0;
    const h = (Math.atan2(bp, ap) * 180) / Math.PI;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hp(a1p, b1), h2p = hp(a2p, b2);
  let dhp = h2p - h1p;
  if (Math.abs(dhp) > 180) dhp += dhp > 0 ? -360 : 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);
  let avgHp = h1p + h2p;
  if (C1p !== 0 && C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) avgHp += avgHp < 360 ? 360 : -360;
    avgHp /= 2;
  }
  const T =
    1 - 0.17 * Math.cos(((avgHp - 30) * Math.PI) / 180) + 0.24 * Math.cos((2 * avgHp * Math.PI) / 180) +
    0.32 * Math.cos(((3 * avgHp + 6) * Math.PI) / 180) - 0.2 * Math.cos(((4 * avgHp - 63) * Math.PI) / 180);
  const SL = 1 + (0.015 * Math.pow(avgLp - 50, 2)) / Math.sqrt(20 + Math.pow(avgLp - 50, 2));
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const dTheta = 30 * Math.exp(-Math.pow((avgHp - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin((2 * dTheta * Math.PI) / 180);
  return Math.sqrt(
    Math.pow(dLp / SL, 2) + Math.pow(dCp / SC, 2) + Math.pow(dHp / SH, 2) + RT * (dCp / SC) * (dHp / SH),
  );
}

export function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

/** Pixel at (x,y). */
export function pixel(png: PNG, x: number, y: number): RGB {
  const i = (png.width * Math.round(y) + Math.round(x)) << 2;
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
}

/** Mean RGB over a box. */
export function meanRgb(png: PNG, x0: number, y0: number, w: number, h: number): RGB {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = Math.round(y0); y < y0 + h; y++) {
    for (let x = Math.round(x0); x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
      const p = pixel(png, x, y);
      r += p.r; g += p.g; b += p.b; n++;
    }
  }
  return n ? { r: r / n, g: g / n, b: b / n } : { r: 0, g: 0, b: 0 };
}

/**
 * Dominant NON-LINEN pixel in a box (mode of quantized colors, excluding the warm
 * linen background) — so a near-black ChatGPT glyph is captured, not excluded.
 */
export function dominantNonLinen(png: PNG, x0: number, y0: number, w: number, h: number): RGB {
  const LINEN = { r: 0xed, g: 0xe8, b: 0xe3 };
  const counts = new Map<string, { rgb: RGB; n: number }>();
  for (let y = Math.round(y0); y < y0 + h; y++) {
    for (let x = Math.round(x0); x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
      const p = pixel(png, x, y);
      if (deltaE2000(p, LINEN) < 12) continue; // skip the linen bg
      const key = `${p.r >> 4}-${p.g >> 4}-${p.b >> 4}`;
      const e = counts.get(key);
      if (e) { e.n++; } else counts.set(key, { rgb: p, n: 1 });
    }
  }
  let best: { rgb: RGB; n: number } | null = null;
  for (const e of counts.values()) if (!best || e.n > best.n) best = e;
  return best ? best.rgb : { r: 0, g: 0, b: 0 };
}

export const fmt = (n: number): string => n.toFixed(2);
