import { useEffect, useRef } from "react";
import { createStage } from "./canvas";
import styles from "./Run.module.scss";

/**
 * The run, drawn on a canvas inside the same frame as every other screen.
 *
 * In the frame rather than portalled over it: the game is authored at 393×852,
 * which is exactly what `.screen` is, so letting the canvas fill it means the
 * picture is 1:1 and the engine's own letterbox maths — `min(w / 393, h / 852)`
 * — only does work on a window too short to fit, which is what it is for.
 *
 * The alternative was a full-bleed canvas portalled to the body with the layer
 * above it turned transparent and click-through. That is what the old build
 * did, and it needed a rule on `#root`, a second set of letterbox maths to put
 * the pause button back on the road, and a canvas that could be scrolled out
 * from under its own UI. None of that is needed once the canvas sits where the
 * screen already is.
 *
 * The window listeners live here rather than inside `createStage`. A module
 * that subscribes on construction has nothing to unsubscribe it, so each visit
 * to this screen would leave another pair on `window`; an effect already has
 * the teardown, so it owns them.
 */
const Run = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /*
     * Safe to run twice: StrictMode mounts, tears down and mounts again in
     * development. `getContext` hands back the same context for a given canvas
     * and measuring is idempotent, so a second pass re-measures and nothing
     * else. The game loop will not be — when it lands it belongs outside React
     * for exactly that reason.
     */
    const stage = createStage(canvas);

    window.addEventListener("resize", stage.resize);
    window.addEventListener("orientationchange", stage.resize);
    return () => {
      window.removeEventListener("resize", stage.resize);
      window.removeEventListener("orientationchange", stage.resize);
    };
  }, []);

  return <canvas className={styles.stage} data-stage ref={canvasRef} />;
};

export default Run;
