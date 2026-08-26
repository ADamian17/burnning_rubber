/** A canvas sized to the device's real pixels, with a CSS-pixel drawing space. */
export interface Stage {
  readonly ctx: CanvasRenderingContext2D;
  readonly dpr: number;
  /** CSS-pixel height of the viewport. */
  height: number;
  /** CSS-pixel width of the viewport. */
  width: number;
}

/**
 * Binds a canvas to the viewport at device-pixel resolution.
 *
 * The backing store is sized width*dpr, then the context is scaled by dpr, so
 * all drawing code works in CSS pixels and still lands on real pixels. Capped
 * at 3 because a 4x buffer costs fill rate for no visible gain.
 */
export const createStage = (canvas: HTMLCanvasElement): Stage => {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('2D canvas context unavailable');

  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const stage: Stage = { ctx, dpr, height: 0, width: 0 };

  const resize = (): void => {
    stage.width = window.innerWidth;
    stage.height = window.innerHeight;
    canvas.width = Math.round(stage.width * dpr);
    canvas.height = Math.round(stage.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  };

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  return stage;
};
