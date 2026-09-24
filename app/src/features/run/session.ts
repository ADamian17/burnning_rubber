import { forcedSeed, frozenFrame } from "../../game/debug";
import { SPRITE_MANIFEST, type SpriteId } from "../../game/fleet";
import { createGame } from "../../game/game";
import type { FinishedRun } from "../../game/run";
import type { PlayerId } from "../../game/fleet";
import type { UpgradeLevels } from "../../game/upgrades";
import { randomSeed } from "../../lib/rng";
import { createStage } from "./canvas";
import { createLoop, STEP } from "./loop";
import { loadSprites } from "./sprites";

export interface StartOptions {
  canvas: HTMLCanvasElement;
  car: PlayerId;
  /** Buzz on a near miss. Passed in so the game never imports Capacitor. */
  onNearMiss?: () => void;
  /** Fired once, the frame the run ends, with what the engine can report. */
  onCrash: (run: FinishedRun) => void;
  /** Seeds the road for a daily; null draws a throwaway seed. */
  seed: number | null;
  upgrades: UpgradeLevels;
}

type Running = {
  detachInput: () => void;
  game: ReturnType<typeof createGame>;
  loop: ReturnType<typeof createLoop>;
  resize: () => void;
};

/**
 * The run, owned outside React.
 *
 * Module state rather than a hook, and that is the whole point. Effects are
 * invoked twice in StrictMode, so a loop started in one would run at double
 * speed with every obstacle spawned twice — and the bug hides in development,
 * where StrictMode is the only thing doing it. Here a second `start` stops the
 * first run before building anything, so calling it twice is the same as
 * calling it once.
 *
 * It also outlives the component on purpose: `__brFreezeAt` steps a game by
 * hand for the snapshot tests, and a teardown that destroyed the game would
 * take the frozen frame with it.
 */
let current: Running | null = null;

/*
 * Which start is allowed to finish.
 *
 * `stop()` at the top of `start()` is not enough on its own: StrictMode calls
 * the effect twice, so two starts are in flight before either has finished
 * awaiting its sprites, and each then builds a loop. The second wins `current`
 * while the first keeps driving a game nobody can reach — a second simulation
 * rendering to the same canvas, which reads as the road running at double
 * speed. Bumping this invalidates anything already in flight.
 */
let generation = 0;

/** Sprites are the same every run, so they are rasterised once per session. */
let sheet: Awaited<ReturnType<typeof loadSprites<SpriteId>>> | null = null;

export const stop = (): void => {
  generation += 1;
  if (!current) return;
  current.loop.stop();
  current.detachInput();
  window.removeEventListener("resize", current.resize);
  window.removeEventListener("orientationchange", current.resize);
  current = null;
};

/** Hold the clock — an overlay over a live run must not let you crash behind it. */
export const pause = (): void => current?.loop.stop();

export const resume = (): void => current?.loop.start();

export const start = async ({
  canvas,
  car,
  onCrash,
  onNearMiss,
  seed,
  upgrades,
}: StartOptions): Promise<void> => {
  stop();
  const mine = generation;

  const stage = createStage(canvas);
  if (!sheet) sheet = await loadSprites<SpriteId>(SPRITE_MANIFEST, stage.dpr);

  /*
   * Anything can have happened across that await: a second mount, or an
   * unmount that left the canvas out of the document. Either way this start is
   * no longer the current one and must build nothing.
   */
  if (mine !== generation || !canvas.isConnected) return;

  let finished = false;
  const game = createGame({
    car,
    onCrash: () => {
      // once: the engine fires this the frame the run ends, and a second
      // payout would bank the same coins twice
      if (finished) return;
      finished = true;
      loop.stop();
      onCrash({
        bestCombo: game.bestCombo,
        coins: game.coins,
        distance: game.distance,
        score: Math.floor(game.score),
      });
    },
    onNearMiss,
    seed: seed ?? forcedSeed() ?? randomSeed(),
    sprites: sheet,
    stage,
    upgrades,
  });

  const loop = createLoop(game.update, (alpha) => game.render(alpha, loop.fps()));
  const detachInput = game.bind(canvas);
  const resize = stage.resize;

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  current = { detachInput, game, loop, resize };

  const frozen = frozenFrame();
  if (frozen === null) {
    loop.start();
    return;
  }

  /*
   * Stepped by hand and never started, so the run cannot advance — or crash —
   * while a screenshot is being taken. A live fps would differ by whatever the
   * machine managed that second, so it is fixed.
   */
  for (let i = 0; i < frozen; i += 1) game.update(STEP);
  game.render(0, 60);
};

/** What the debug seam reads. Null between runs rather than stale. */
export const peek = () => current?.game ?? null;
