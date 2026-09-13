import boarhound from '../assets/cars/boarhound.svg';
import donkeywork from '../assets/cars/donkeywork.svg';
import hatpin from '../assets/cars/hatpin.svg';
import straycat from '../assets/cars/straycat.svg';
import trafficBox from '../assets/cars/traffic-box.svg';
import trafficCompact from '../assets/cars/traffic-compact.svg';
import trafficPatrol from '../assets/cars/traffic-patrol.svg';
import trafficSedan from '../assets/cars/traffic-sedan.svg';
import trafficSemi from '../assets/cars/traffic-semi.svg';
import trafficVan from '../assets/cars/traffic-van.svg';
import { PICKUP_MANIFEST, type PickupId } from './pickups';

export type PlayerId = 'boarhound' | 'donkeywork' | 'hatpin' | 'straycat';
export type TrafficId =
  | 'traffic-box'
  | 'traffic-compact'
  | 'traffic-patrol'
  | 'traffic-sedan'
  | 'traffic-semi'
  | 'traffic-van';
export type VehicleId = PlayerId | TrafficId;

export interface Vehicle {
  /** Nose-to-tail length in design points. */
  readonly length: number;
  readonly name: string;
  readonly url: string;
  /** Footprint width in design points — the number that decides a gap. */
  readonly width: number;
}

export interface PlayerCar extends Vehicle {
  /** Coin price. 0 means owned from the start. */
  readonly cost: number;
  readonly grip: number;
  /** Points per second of lateral travel at full tilt. */
  readonly handling: number;
  /** Short class label shown under the name in the garage. */
  readonly klass: string;
  readonly speed: number;
}

export interface TrafficCar extends Vehicle {
  /** 1 (easy to pass) to 5 (a wall). Drives spawn weighting. */
  readonly threat: number;
}

/*
 * Price tracks how much easier a car makes the game, and width decides that.
 *
 * A lane is 98.25pt, so the Hatpin's 46pt leaves more than twice the slack of
 * the Boarhound's 72pt — it fits gaps the others cannot, which is the whole
 * game. It was the cheapest unlock at 600 while the second-widest and slowest
 * car cost 1800, so coins bought the best car first and everything after it was
 * a downgrade.
 */
export const PLAYERS: Readonly<Record<PlayerId, PlayerCar>> = {
  boarhound: { cost: 900, grip: 4, handling: 3, klass: 'WIDEBODY', length: 128, name: 'BOARHOUND', speed: 6, url: boarhound, width: 72 },
  donkeywork: { cost: 1400, grip: 6, handling: 3, klass: 'HAULER', length: 142, name: 'DONKEY WORK', speed: 2, url: donkeywork, width: 68 },
  hatpin: { cost: 2200, grip: 2, handling: 6, klass: 'NEEDLE', length: 112, name: 'HATPIN', speed: 3, url: hatpin, width: 46 },
  straycat: { cost: 0, grip: 4, handling: 4, klass: 'MUSCLE', length: 122, name: 'STRAY CAT', speed: 3, url: straycat, width: 60 }
};

export const TRAFFIC: Readonly<Record<TrafficId, TrafficCar>> = {
  'traffic-box': { length: 182, name: 'COLD STORE', threat: 4, url: trafficBox, width: 74 },
  'traffic-compact': { length: 96, name: 'FLEA', threat: 1, url: trafficCompact, width: 46 },
  'traffic-patrol': { length: 128, name: 'PATROL', threat: 2, url: trafficPatrol, width: 62 },
  'traffic-sedan': { length: 128, name: 'COMMUTER', threat: 2, url: trafficSedan, width: 62 },
  'traffic-semi': { length: 234, name: 'LEVIATHAN', threat: 5, url: trafficSemi, width: 76 },
  'traffic-van': { length: 158, name: 'PARCEL', threat: 3, url: trafficVan, width: 70 }
};

export const TRAFFIC_IDS = Object.keys(TRAFFIC) as TrafficId[];

/** Anything the rasteriser draws: vehicles, plus everything lying on the road. */
export type SpriteId = VehicleId | PickupId;

/** Every sprite the game draws, as [id, url, width, height] for the rasteriser. */
export const SPRITE_MANIFEST: ReadonlyArray<readonly [SpriteId, string, number, number]> = [
  ...([...Object.entries(PLAYERS), ...Object.entries(TRAFFIC)] as [VehicleId, PlayerCar][]).map(
    ([id, v]) => [id, v.url, v.width, v.length] as const
  ),
  ...PICKUP_MANIFEST
];

/** Player car ids in showroom order. */
export const PLAYER_IDS = Object.keys(PLAYERS) as PlayerId[];

/**
 * Width expressed as a comparable 1-6 stat.
 *
 * Width decides whether a gap is passable, so it belongs beside speed and grip
 * rather than buried in a spec line. Inverted because narrower is better.
 */
export const slimness = (width: number): number =>
  Math.max(1, Math.min(6, Math.round(6 - (width - 46) * (4 / 26))));
