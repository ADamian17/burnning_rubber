/**
 * The inspection seam end-to-end tests assert through.
 *
 * The game runs on a canvas, so distance, score and countdown state are
 * variables in a closure — they become pixels, and there is no element to
 * query. Without this, a test could only prove that the pause panel appeared,
 * not that the simulation actually stopped. Which was exactly the bug.
 */

/** A live view of the running game. Every read pulls current values. */
export interface DebugState {
  /** True while the pre-run countdown is holding traffic back. */
  counting: boolean;
  crashed: boolean;
  /** Metres travelled this run. */
  distance: number;
  overlay: string | null;
  route: string;
  score: number;
}

declare global {
  interface Window {
    /**
     * Present in development builds only — `exposeDebugState` is compiled out
     * of production, so treat this as undefined in any shipped code.
     */
    __br?: DebugState;
    /** Set before boot to fix a run's seed, so its road is reproducible. */
    __brSeed?: number;
    /** Set before boot to start every run frozen on this frame. */
    __brFreezeAt?: number;
  }
}

/**
 * A seed forced by a test, or null to let the run be random.
 *
 * Snapshots of the run screen are otherwise impossible: the road is different
 * every time, so every comparison fails for a reason that is not a regression.
 */
export const forcedSeed = (): number | null =>
  import.meta.env.DEV && typeof window.__brSeed === 'number' ? window.__brSeed : null;

/**
 * The frame a run should be frozen on, or null to play it live.
 *
 * requestAnimationFrame fires on the display's schedule, so "wait a moment,
 * then screenshot" lands somewhere different every time. Stepping the
 * simulation a fixed number of times and rendering once is reproducible to the
 * pixel.
 *
 * Read when the run starts rather than offered as a function to call after it:
 * the first version was a callback, and an unattended car crashes in about six
 * seconds, which is less time than the round-trips took. The snapshot came back
 * showing the summary screen. A run that never starts its loop cannot lose that
 * race.
 */
export const frozenFrame = (): number | null =>
  import.meta.env.DEV && typeof window.__brFreezeAt === 'number' ? window.__brFreezeAt : null;

/**
 * Publishes `window.__br` in development builds and does nothing otherwise.
 *
 * `read` is installed as a getter rather than called once: a snapshot taken at
 * boot would report zeroes forever and quietly pass every assertion made
 * against it.
 */
export const exposeDebugState = (read: () => DebugState): void => {
  if (!import.meta.env.DEV) return;
  Object.defineProperty(window, '__br', { configurable: true, get: read });
};
