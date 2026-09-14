import type { PlayerId } from '../../game/fleet';
import type { RunResult, SaveState } from '../../game/state';
import type { UpgradeId } from '../../game/upgrades';

/** The audio and feel switches, which all behave identically. */
/**
 * What the store holds.
 *
 * One field, deliberately. `save` is nested rather than spread flat alongside
 * the actions so that it *is* exactly what gets persisted — flat, every write
 * would have to separate the data from the functions first, and adding an
 * action would mean remembering to exclude it from the write.
 */
export interface PlayerState {
  save: SaveState;
}

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
