import { Preferences } from '@capacitor/preferences';
import { PLAYER_IDS, type PlayerId } from './fleet';

const KEY = 'burning-rubber:save';

/**
 * How the car is steered.
 *
 * Tap-lanes and tilt were dropped rather than built. Both were offered in
 * settings and neither was ever implemented, so choosing one silently gave you
 * drag under a different name — a setting that lies is worse than a setting
 * that is absent.
 *
 * Left as a union of one rather than collapsed away: re-adding a scheme should
 * be a type change the compiler walks you through, not a rediscovery.
 */
export type ControlScheme = 'drag';

/** Result of the most recent run, so the summary survives a reload. */
export interface RunResult {
  /** Highest near-miss multiplier reached during the run. */
  bestCombo: number;
  coins: number;
  distance: number;
  isBest: boolean;
  score: number;
}

export interface SaveState {
  best: number;
  coins: number;
  control: ControlScheme;
  equipped: PlayerId;
  haptics: boolean;
  lastRun: RunResult | null;
  music: boolean;
  /** False until onboarding has been dismissed once. */
  onboarded: boolean;
  owned: PlayerId[];
  sfx: boolean;
}

const FRESH: SaveState = {
  best: 0,
  coins: 0,
  control: 'drag',
  equipped: 'straycat',
  haptics: true,
  lastRun: null,
  music: true,
  onboarded: false,
  owned: ['straycat'],
  sfx: true
};

/**
 * Fill in a run summary written before a field existed.
 *
 * bestCombo arrived after the first saves did, so a returning player has a
 * lastRun without one. Defaulting to 1 here keeps the summary screen honest —
 * a run recorded before combos existed genuinely had no streak.
 */
const reviveRun = (raw: RunResult | undefined | null): RunResult | null => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    bestCombo: Number.isFinite(raw.bestCombo) ? Number(raw.bestCombo) : 1,
    coins: Number.isFinite(raw.coins) ? Number(raw.coins) : 0,
    distance: Number.isFinite(raw.distance) ? Number(raw.distance) : 0,
    isBest: raw.isBest === true,
    score: Number.isFinite(raw.score) ? Number(raw.score) : 0
  };
};

/** Narrow unknown JSON to a SaveState, discarding anything that no longer exists. */
export const revive = (raw: unknown): SaveState => {
  if (typeof raw !== 'object' || raw === null) return { ...FRESH };
  const value = raw as Partial<SaveState>;
  const owned = (Array.isArray(value.owned) ? value.owned : []).filter((id): id is PlayerId =>
    PLAYER_IDS.includes(id as PlayerId)
  );
  if (!owned.includes('straycat')) owned.push('straycat');
  const equipped =
    value.equipped && owned.includes(value.equipped) ? value.equipped : 'straycat';
  return {
    best: Number.isFinite(value.best) ? Number(value.best) : 0,
    coins: Number.isFinite(value.coins) ? Number(value.coins) : 0,
    // a save from when tap-lanes or tilt could be chosen comes back as drag,
    // which is what those players were getting anyway
    control: 'drag',
    equipped,
    haptics: value.haptics !== false,
    lastRun: reviveRun(value.lastRun),
    music: value.music !== false,
    onboarded: value.onboarded === true,
    owned,
    sfx: value.sfx !== false
  };
};

export const loadState = async (): Promise<SaveState> => {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value ? revive(JSON.parse(value)) : { ...FRESH };
  } catch {
    // a corrupt or unreadable save should cost the player their progress, not
    // the ability to launch the game
    return { ...FRESH };
  }
};

export const saveState = async (state: SaveState): Promise<void> => {
  await Preferences.set({ key: KEY, value: JSON.stringify(state) });
};

export const resetState = async (): Promise<SaveState> => {
  await Preferences.remove({ key: KEY });
  return { ...FRESH };
};
