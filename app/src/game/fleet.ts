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
  readonly grip: number;
  /** Points per second of lateral travel at full tilt. */
  readonly handling: number;
  readonly speed: number;
}

export interface TrafficCar extends Vehicle {
  /** 1 (easy to pass) to 5 (a wall). Drives spawn weighting. */
  readonly threat: number;
}

export const PLAYERS: Readonly<Record<PlayerId, PlayerCar>> = {
  boarhound: { grip: 4, handling: 3, length: 128, name: 'BOARHOUND', speed: 6, url: boarhound, width: 72 },
  donkeywork: { grip: 6, handling: 3, length: 142, name: 'DONKEY WORK', speed: 2, url: donkeywork, width: 68 },
  hatpin: { grip: 2, handling: 6, length: 112, name: 'HATPIN', speed: 3, url: hatpin, width: 46 },
  straycat: { grip: 4, handling: 4, length: 122, name: 'STRAY CAT', speed: 3, url: straycat, width: 60 }
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

/** Every sprite the game draws, as [id, url, width, height] for the rasteriser. */
export const SPRITE_MANIFEST: ReadonlyArray<readonly [VehicleId, string, number, number]> = [
  ...(Object.entries(PLAYERS) as [PlayerId, PlayerCar][]),
  ...(Object.entries(TRAFFIC) as [TrafficId, TrafficCar][])
].map(([id, v]) => [id, v.url, v.width, v.length] as const);
