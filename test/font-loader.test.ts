import { describe, it, expect, vi, beforeEach } from 'vitest';

// FV2-1 (AC1.2): a failed brand-font load must FAIL LOUD via cancelRender, not
// silently continue with a fallback face. We mock remotion's render-lifecycle
// hooks so the load-failure path is observable without a real render.
// vi.hoisted lets these spies be referenced inside the hoisted vi.mock factory.
const { cancelRender, continueRender } = vi.hoisted(() => ({
  cancelRender: vi.fn(),
  continueRender: vi.fn(),
}));

vi.mock('remotion', () => ({
  delayRender: () => 1,
  continueRender,
  cancelRender,
  // staticFile is referenced by shared.tsx's default loader (unused here).
  staticFile: (p: string) => p,
}));

import { loadBrandFonts } from '../src/compositions/lesson-scenes/shared';

beforeEach(() => {
  cancelRender.mockClear();
  continueRender.mockClear();
  // shared.tsx adds the loaded face to document.fonts on success.
  (globalThis as { document?: unknown }).document = { fonts: { add: vi.fn() } };
});

describe('loadBrandFonts failure path (render determinism)', () => {
  it('calls cancelRender with the error when the face fails to load', async () => {
    const boom = new Error('font parse failed');
    loadBrandFonts(() => [{ load: () => Promise.reject(boom) }]);

    // let the rejected load() promise + .catch settle
    await new Promise((r) => setTimeout(r, 0));

    expect(cancelRender).toHaveBeenCalledTimes(1);
    expect(cancelRender).toHaveBeenCalledWith(boom);
    expect(continueRender).not.toHaveBeenCalled();
  });

  it('continues the render (no cancel) when the face loads', async () => {
    loadBrandFonts(() => [{ load: () => Promise.resolve({} as FontFace) }]);

    await new Promise((r) => setTimeout(r, 0));

    expect(continueRender).toHaveBeenCalledTimes(1);
    expect(cancelRender).not.toHaveBeenCalled();
  });
});
