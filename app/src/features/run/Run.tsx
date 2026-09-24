import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { exposeDebugState } from "../../game/debug";
import { seedForDay } from "../daily/challenge";
import { usePlayerStore } from "../../store/player/usePlayerStore";
import { peek, start, stop } from "./session";
import styles from "./Run.module.scss";

/** What the daily screen puts in the navigation, when a run is today's challenge. */
interface RunLocationState {
  day?: string;
}

/**
 * The run, drawn on a canvas inside the same frame as every other screen.
 *
 * In the frame rather than portalled over it: the game is authored at 393×852,
 * which is exactly what `.screen` is, so letting the canvas fill it means the
 * picture is 1:1 and the engine's own letterbox maths only does work on a
 * window too short to fit, which is what it is for.
 *
 * The component owns the canvas and nothing else. Starting the game, the loop
 * and the sprite sheet all belong to `./session`, a plain module — effects run
 * twice in StrictMode, and a loop started in one would run at double speed.
 *
 * The day this run is scored against arrives as navigation state rather than
 * module state, which is what makes a retry from the summary an ordinary run:
 * `navigate('/run')` carries no day, so there is nothing to consume and no way
 * to accidentally claim the same daily twice. The old build kept it in a
 * module variable and had to clear it on read.
 */
const Run = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate();
  const { state } = useLocation() as { state: RunLocationState | null };
  const day = state?.day ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /*
     * Read imperatively, not through a selector. The contract with the engine
     * is two edges — what the run starts with, and what it reports at the crash
     * — so this screen has no business re-rendering when a field changes; it
     * paints on a canvas and owns no DOM that could show one. Subscribing would
     * also put `equipped` and `upgrades` in this effect's dependencies, and
     * re-running it mid-run would restart the road under the player.
     */
    const { equipped, recordRun, upgrades } = usePlayerStore.getState();

    void start({
      canvas,
      car: equipped,
      onCrash: (run) => {
        recordRun(run, day);
        // replace, so the back gesture from the summary does not resurrect a
        // finished run — it is over, and re-entering would start a new one
        navigate("/summary", { replace: true });
      },
      seed: day === null ? null : seedForDay(day),
      upgrades,
    });

    /*
     * Published for the end-to-end suite, which asserts the countdown holds
     * traffic back and that a crash routes to the summary. A getter rather than
     * a snapshot, so it reads the live game rather than whatever was true when
     * the run started.
     */
    exposeDebugState(() => {
      const game = peek();
      return {
        counting: game?.counting ?? false,
        crashed: game?.crashed ?? false,
        distance: game?.distance ?? 0,
        overlay: null,
        route: "run",
        score: game?.score ?? 0,
      };
    });

    return stop;
  }, [day, navigate]);

  return <canvas className={styles.stage} data-stage ref={canvasRef} />;
};

export default Run;
