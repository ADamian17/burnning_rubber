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
  }
}

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
