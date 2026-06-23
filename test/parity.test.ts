import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { sceneTitleStyle } from '../src/compositions/lesson-scenes/shared';
import { BRAND } from '../src/brand/tokens';

// FV2-5 / AC5.1 — the anti-drift lint. Each assertion below pins a value the
// v2→v2.x facelift restored, so a silent revert to the heavier/rounder/softer
// pre-FV2 look goes RED. The drift this guards (punch list): "800 vs 700,
// 14px vs 4px, resting shadows, pill radii".

const scenesDir = path.join(__dirname, '..', 'src', 'compositions', 'lesson-scenes');
const readScene = (base: string): string =>
  fs.readFileSync(path.join(scenesDir, `${base}.tsx`), 'utf8');

describe('FV2 parity guardrails', () => {
  // FV2-2 / AC2.1 — punch-list "800 vs 700". Title weight must resolve to the
  // brand bold (700), NOT extraBold (800). Behavioral check on the actual style.
  it('title style weight is bold (700), not extraBold (800)', () => {
    const weight = sceneTitleStyle(84).fontWeight;
    expect(weight).toBe(BRAND.font.weights.bold);
    expect(weight).not.toBe(BRAND.font.weights.extraBold);
  });

  // FV2-2 / AC2.3 — punch-list "14px vs 4px". The 14px window radius belongs
  // ONLY to genuine chat/voice/browser window chrome. Any grid/feature/recap
  // card reaching for radiusWindow is the rounded-corner drift returning.
  it('radiusWindow is used only by genuine window components', () => {
    const ALLOWLIST = ['ComparisonChats', 'VoiceDemo', 'ScreenFlow', 'PreviewBand', 'ToolDemo', 'primitives'];
    const offenders = fs
      .readdirSync(scenesDir)
      .filter((f) => f.endsWith('.tsx'))
      .filter((f) => readScene(path.basename(f, '.tsx')).includes('radiusWindow'))
      .map((f) => path.basename(f, '.tsx'))
      .filter((base) => !ALLOWLIST.includes(base));
    expect(offenders).toEqual([]);
  });

  // FV2-2 / AC2.4 — punch-list "resting shadows". Grid-card scenes carry NO
  // unconditional resting SHADOW.card; depth appears only on the focused branch
  // (SHADOW.cardHover) or is 'none'. The (?!Hover) lookahead matches a bare
  // resting SHADOW.card but not the allowed focus-only SHADOW.cardHover.
  it('no resting SHADOW.card on the fixed grid-card scenes', () => {
    const GRID_CARDS = ['FeatureGrid', 'RecapGrid', 'CapabilityTable', 'AssignmentList', 'AuditQuadrant', 'DigDeeper'];
    for (const base of GRID_CARDS) {
      expect(readScene(base), `${base} must not have a resting SHADOW.card`).not.toMatch(/SHADOW\.card(?!Hover)/);
    }
  });

  // FV2-2 / AC2.5 — punch-list "pill radii". The JourneyMap "you are here" tag
  // was a 999 (full-pill) radius; the flat system uses 2. Guards only this
  // oversized tag — small circular dots (~30px '50%' / ≤12px) elsewhere are fine.
  it('JourneyMap "you are here" tag is not a 999 full-pill', () => {
    expect(readScene('JourneyMap')).not.toMatch(/borderRadius:\s*999/);
  });
});
