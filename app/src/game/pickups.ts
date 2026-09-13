import coin from '../assets/pickups/coin.svg';

export type PickupId = 'coin';

export interface PickupSpec {
  /** Diameter in design points. Square, so one number covers both axes. */
  readonly size: number;
  /** What taking one is worth. */
  readonly value: number;
  readonly url: string;
}

/**
 * Everything the player can collect off the road.
 *
 * Kept apart from the fleet because a pickup is not a vehicle: it has no
 * length distinct from its width, it never blocks a lane, and colliding with
 * one is a reward rather than the end of the run.
 */
export const PICKUPS: Readonly<Record<PickupId, PickupSpec>> = {
  coin: { size: 34, url: coin, value: 1 }
};

export const PICKUP_IDS = Object.keys(PICKUPS) as PickupId[];

/** Sprite manifest entries, in the same [id, url, width, height] shape the fleet uses. */
export const PICKUP_MANIFEST: ReadonlyArray<readonly [PickupId, string, number, number]> = (
  Object.entries(PICKUPS) as [PickupId, PickupSpec][]
).map(([id, p]) => [id, p.url, p.size, p.size] as const);
