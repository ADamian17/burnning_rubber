/** A canvas sized to the device's real pixels, with a CSS-pixel drawing space. */
export interface Stage {
  readonly ctx: CanvasRenderingContext2D;
  readonly dpr: number;
  /** CSS-pixel height of the viewport. */
  height: number;
  /**
   * Re-measure and re-size the backing store.
   *
   * Exposed rather than self-subscribed so the caller owns when it runs. The
   * component that mounts the canvas already has a teardown to hang it on, and
   * a listener this module added itself would outlive every unmount — one more
   * pair stacking up on `window` each time the run screen is entered.
   */
  resize: () => void;
  /** CSS-pixel width of the viewport. */
  width: number;
}

/**
 * Binds a canvas to its own layout box at device-pixel resolution.
 *
 * The backing store is sized width*dpr, then the context is scaled by dpr, so
 * all drawing code works in CSS pixels and still lands on real pixels. Capped
 * at 3 because a 4x buffer costs fill rate for no visible gain.
 *
 * Measures once and hands back `resize`; it attaches nothing. Calling it twice
 * on the same canvas is harmless — `getContext` returns the same context and
 * the measurement is idempotent — which matters because StrictMode will.
 */
export const createStage = (canvas: HTMLCanvasElement): Stage => {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('2D canvas context unavailable');

  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const resize = (): void => {
    /*
     * The canvas's own box, not the window's. The run screen renders inside the
     * 393x852 frame the rest of the app lives in, so measuring the viewport
     * would size the backing store to a desktop window and then display it in a
     * 393px-wide element — the same picture, squashed.
     *
     * This means the element has to be sized by CSS before the first measure.
     * An unsized canvas reports its intrinsic 300x150, and the game would draw
     * a correct picture at the wrong scale rather than fail.
     */
    stage.width = canvas.clientWidth;
    stage.height = canvas.clientHeight;
    canvas.width = Math.round(stage.width * dpr);
    canvas.height = Math.round(stage.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  };

  const stage: Stage = { ctx, dpr, height: 0, resize, width: 0 };
  resize();

  return stage;
};
