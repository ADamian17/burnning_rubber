import type { PlayerId } from '../../game/fleet';
import type { RunResult, SaveState } from './save';
import type { UpgradeId } from '../../game/upgrades';

/**
 * What the store holds: the save itself, flat.
 *
 * An alias rather than a re-declaration of the same fields. Those two shapes
 * have to stay identical — the store's state is written to disk verbatim — and
 * writing them out twice is how they drift. It already had: the first attempt
 * at flattening this listed six fields and silently lost `upgrades` and
 * `daily`, which the shop and the daily screen read.
 *
 * Flat rather than nested under `save`, which is what it used to be. The
 * nesting made persistence trivially correct — one key to write, no way for an
 * action to leak into it — at the cost of every selector in the app reading
 * `state.save.coins` to get a number. `partialize` now does that separation
 * explicitly instead, and `saveState` serialises through JSON, which drops any
 * function that slips past it.
 */
export type PlayerState = SaveState;

/**
 * What the store does.
 *
 * These are the rules, not setters. Each one decides whether the change is
 * allowed — the shop re-checks affordability before it spends, the daily pays
 * once per day — because those are decisions about the game, not about
 * rendering, and they used to be stranded in click handlers where nothing could
 * test them.
 */
export interface PlayerActions {
  /** Unlock a car and equip it. No-op if already owned or unaffordable. */
  buyCar: (id: PlayerId) => void;
  /** Buy the next level of an upgrade. No-op if maxed or unaffordable. */
  buyUpgrade: (id: UpgradeId) => void;
  completeOnboarding: () => void;
  equip: (id: PlayerId) => void;
  /** Bank a finished run, paying the daily if `day` was met for the first time. */
  recordRun: (run: RunResult, day: string | null) => void;
  /** Wipe progress. Onboarding and the switches survive — a reset is not a new player. */
  reset: () => void;
}

export type PlayerStore = PlayerActions & PlayerState;
