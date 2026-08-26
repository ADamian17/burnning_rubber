/** Simulation step, in seconds. Fixed so physics never depends on refresh rate. */
export const STEP = 1 / 60;

/** Largest frame gap we will simulate; beyond this we drop time instead of spiralling. */
const MAX_FRAME = 0.25;

export interface Loop {
  readonly fps: () => number;
  start: () => void;
  stop: () => void;
}

/**
 * Fixed-timestep loop with a render interpolation factor.
 *
 * This matters more on mobile than desktop: a 120Hz ProMotion iPhone fires
 * requestAnimationFrame twice as often as a 60Hz one, so anything that moves
 * per-frame runs at double speed there. Accumulating real time and stepping a
 * fixed amount makes the simulation identical on both.
 */
export const createLoop = (
  update: (step: number) => void,
  render: (alpha: number) => void
): Loop => {
  let accumulator = 0;
  let frames = 0;
  let last = 0;
  let measured = 0;
  let raf = 0;
  let sampleStart = 0;

  const tick = (now: number): void => {
    raf = requestAnimationFrame(tick);

    const seconds = now / 1000;
    const elapsed = Math.min(seconds - last, MAX_FRAME);
    last = seconds;
    accumulator += elapsed;

    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }

    render(accumulator / STEP);

    frames += 1;
    if (seconds - sampleStart >= 0.5) {
      measured = frames / (seconds - sampleStart);
      frames = 0;
      sampleStart = seconds;
    }
  };

  return {
    fps: () => measured,
    start: () => {
      last = performance.now() / 1000;
      sampleStart = last;
      raf = requestAnimationFrame(tick);
    },
    stop: () => cancelAnimationFrame(raf)
  };
};
