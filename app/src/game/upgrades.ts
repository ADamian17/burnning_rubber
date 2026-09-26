import { MAGNET_REACH, PICKUPS, type PowerId } from './pickups';

export type UpgradeId = PowerId;

/** Levels bought, 0 up to each upgrade's max. */
export type UpgradeLevels = Record<UpgradeId, number>;

export interface UpgradeSpec {
  /** Coin price of each level, in order. Length is the maximum level. */
  readonly costs: readonly number[];
  readonly label: string;
  /** What the card says the upgrade buys. */
  readonly note: string;
  /** How much one level adds, in `unit`. */
  readonly step: number;
  readonly unit: string;
}

/**
 * What coins buy once the garage is full.
 *
 * Every upgrade tunes a number the power-ups already use rather than
 * introducing a parallel system: the shop makes the road pickups better, it
 * does not sell a second copy of them. That also keeps the artboard's staggered
 * countdowns intact — powers are still found, still start when collected, and
 * simply run longer or reach further.
 *
 * Priced well under the cars deliberately. Cars are the long goal at 600-1800
 * coins; upgrades are the thing a player can afford after a couple of good runs,
 * so coins mean something from the first visit rather than only after twenty.
 */
export const UPGRADES: Readonly<Record<UpgradeId, UpgradeSpec>> = {
  magnet: {
    costs: [90, 220, 460],
    label: 'MAGNET REACH',
    note: 'Pulls coins in from further out.',
    step: 55,
    unit: 'PT'
  },
  shield: {
    costs: [110, 260, 540],
    label: 'SHIELD TIME',
    note: 'Stays up longer before it lapses.',
    step: 2,
    unit: 'S'
  },
  slowmo: {
    costs: [130, 290, 560],
    label: 'SLOW-MO TIME',
    note: 'Holds the road slow for longer.',
    step: 1.5,
    unit: 'S'
  }
};

export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[];

export const FRESH_UPGRADES: UpgradeLevels = { magnet: 0, shield: 0, slowmo: 0 };

/** Highest level that can be bought. */
export const maxLevel = (id: UpgradeId): number => UPGRADES[id].costs.length;

/** Cost of the next level, or null when it is already maxed. */
export const nextCost = (id: UpgradeId, level: number): number | null =>
  level >= maxLevel(id) ? null : UPGRADES[id].costs[level];

/**
 * How long a power runs at the player's current levels.
 *
 * The magnet is the exception: its upgrade buys reach, not time, so its
 * duration is whatever the pickup spec says regardless of level.
 */
export const powerSeconds = (id: PowerId, levels: UpgradeLevels): number => {
  const spec = PICKUPS[id];
  const base = spec.kind === 'power' ? spec.seconds : 0;
  return id === 'magnet' ? base : base + UPGRADES[id].step * levels[id];
};

/** How far a magnet reaches at the player's current level. */
export const magnetReach = (levels: UpgradeLevels): number =>
  MAGNET_REACH + UPGRADES.magnet.step * levels.magnet;

/** The current effect value, for the shop card to show. */
export const effectOf = (id: UpgradeId, levels: UpgradeLevels): number =>
  id === 'magnet' ? magnetReach(levels) : powerSeconds(id, levels);
