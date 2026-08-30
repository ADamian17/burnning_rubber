import { Preferences } from '@capacitor/preferences';
import { PLAYER_IDS, type PlayerId } from './fleet';

const KEY = 'burning-rubber:save';

export interface SaveState {
  best: number;
  coins: number;
  equipped: PlayerId;
  owned: PlayerId[];
}

const FRESH: SaveState = { best: 0, coins: 0, equipped: 'straycat', owned: ['straycat'] };

/** Narrow unknown JSON to a SaveState, discarding anything that no longer exists. */
const revive = (raw: unknown): SaveState => {
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
    equipped,
    owned
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
