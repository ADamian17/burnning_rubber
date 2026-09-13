import coin from '../assets/pickups/coin.svg';
import magnet from '../assets/pickups/magnet.svg';
import shield from '../assets/pickups/shield.svg';
import slowmo from '../assets/pickups/slowmo.svg';

/** A power-up runs for a while; the coin is banked and gone. */
export type PowerId = 'magnet' | 'shield' | 'slowmo';
export type PickupId = 'coin' | PowerId;

interface CoinSpec {
  readonly kind: 'coin';
  readonly size: number;
  readonly url: string;
  /** What banking one is worth. */
  readonly value: number;
}

interface PowerSpec {
  readonly kind: 'power';
  /**
   * Pressure, 0 to 1, before this can drop at all.
   *
   * The same idea as a traffic type's threat rating: the road introduces what
   * it needs when it needs it. A power that answers a problem the player does
   * not have yet only teaches them to ignore it.
   */
  readonly from: number;
  /** Shown on the HUD pill beside the countdown. */
  readonly label: string;
  /** How long it runs, in seconds. Taking a second one refreshes rather than stacks. */
  readonly seconds: number;
  readonly size: number;
  readonly url: string;
}

export type PickupSpec = CoinSpec | PowerSpec;

/**
 * Everything the player can collect off the road.
 *
 * Kept apart from the fleet because a pickup is not a vehicle: it has no length
 * distinct from its width, it never blocks a lane, and touching one is a reward
 * rather than the end of the run.
 *
 * A discriminated union rather than one shape with optional fields — a coin has
 * no duration and a power-up has no coin value, and modelling that as two
 * nullable numbers invites reading the wrong one.
 */
export const PICKUPS: Readonly<Record<PickupId, PickupSpec>> = {
  coin: { kind: 'coin', size: 34, url: coin, value: 1 },
  // both useful from the first metre: coins matter immediately, and so does
  // surviving a mistake
  magnet: { from: 0, kind: 'power', label: 'MAGNET', seconds: 8, size: 36, url: magnet },
  shield: { from: 0, kind: 'power', label: 'SHIELD', seconds: 10, size: 36, url: shield },
  /*
   * Held back until the road is genuinely quick.
   *
   * Slowing a road that is already near its base speed changes almost nothing,
   * so an early slow-mo reads as a dud. Past halfway up the ramp it is a
   * rescue, which is what it is meant to feel like.
   */
  slowmo: { from: 0.45, kind: 'power', label: 'SLOW-MO', seconds: 5, size: 36, url: slowmo }
};

export const PICKUP_IDS = Object.keys(PICKUPS) as PickupId[];

export const POWER_IDS = PICKUP_IDS.filter(
  (id): id is PowerId => PICKUPS[id].kind === 'power'
);

/** How much a slowed road scrolls at, as a fraction of normal. */
export const SLOWMO_SCALE = 0.55;

/** How far a magnet reaches for a pickup, in design points. */
export const MAGNET_REACH = 210;

/** How fast a magnet drags a pickup toward the car, in points per second. */
export const MAGNET_PULL = 520;

/** Sprite manifest entries, in the same [id, url, width, height] shape the fleet uses. */
export const PICKUP_MANIFEST: ReadonlyArray<readonly [PickupId, string, number, number]> = (
  Object.entries(PICKUPS) as [PickupId, PickupSpec][]
).map(([id, p]) => [id, p.url, p.size, p.size] as const);
