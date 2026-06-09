import React, { useEffect } from 'react';
import { useCurrentFrame, delayRender, continueRender } from 'remotion';
import type { FrameReport, MeasuredEl } from '../../lib/gate-layout';

/**
 * Gate L sensor (#73). Mounted by LessonVideo only when the `layoutProbe`
 * input prop is set (gate:layout renders stills with it). After layout
 * settles it measures every visible element via getBoundingClientRect and
 * emits a FrameReport on the console with a sentinel prefix; the gate script
 * collects it through @remotion/renderer's onBrowserLog. Never part of a
 * production render.
 */

export const LAYOUT_PROBE_SENTINEL = '__LAYOUT_PROBE__';

function measureDocument(frame: number): FrameReport {
  const els: MeasuredEl[] = [];
  const indexOf = new Map<Element, number>();
  const all = Array.from(document.body.querySelectorAll('*'));

  for (const node of all) {
    if (!(node instanceof HTMLElement)) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    if (parseFloat(style.opacity) < 0.05) continue;

    const textLeaf = Array.from(node.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
    );
    const overflowClips = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflow);
    const clipped =
      overflowClips &&
      (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1);

    // Only record elements that matter to the rules: text leaves and clipped boxes.
    if (!textLeaf && !clipped) continue;

    const ancestors: number[] = [];
    let p = node.parentElement;
    while (p) {
      const idx = indexOf.get(p);
      if (idx !== undefined) ancestors.push(idx);
      p = p.parentElement;
    }

    const i = els.length;
    indexOf.set(node, i);
    els.push({
      i,
      ancestors,
      tag: node.tagName.toLowerCase(),
      text: textLeaf ? (node.textContent ?? '').trim().slice(0, 60) : '',
      textLeaf,
      decor: node.closest('[data-decor]') !== null,
      rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      clipped,
    });
  }

  return { frame, els };
}

export const LayoutProbe: React.FC = () => {
  const frame = useCurrentFrame();

  useEffect(() => {
    const handle = delayRender(`layout-probe-frame-${frame}`);
    // Double rAF: layout + paint have settled before measuring.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const report = measureDocument(frame);
          // eslint-disable-next-line no-console
          console.log(LAYOUT_PROBE_SENTINEL + JSON.stringify(report));
        } finally {
          continueRender(handle);
        }
      });
    });
  }, [frame]);

  return null;
};
