import { describe, expect, it } from 'vitest';
import { DESIGN_WIDTH, LANE_CENTRES, LANE_COUNT, LANE_WIDTH, START_X } from './constants';
import { HITBOX_INSET } from './constants';
import { MAGNET_REACH, PICKUPS, PICKUP_IDS, POWER_IDS, SLOWMO_SCALE } from './pickups';
import { COMBO_WINDOW, NEAR_MISS_MARGIN } from './constants';
import {
  FRESH_UPGRADES,
  UPGRADES,
  UPGRADE_IDS,
  effectOf,
  magnetReach,
  maxLevel,
  nextCost,
  powerSeconds
} from './upgrades';
import { PLAYERS, PLAYER_IDS, SPRITE_MANIFEST, TRAFFIC, TRAFFIC_IDS, slimness } from './fleet';
import { revive } from './state';

/**
 * These are invariant tests, not unit tests.
 *
 * They don't check that functions return what functions return — they encode
 * the rules the game is built on, the ones that are easy to violate by
 * accident while editing something nearby. Every assertion here corresponds to
 * a way the game was actually broken, or an obvious neighbouring way it could
 * be. They are cheap to run and they never catch a layout problem; that is
 * what running the app is for.
 */

describe('lane geometry', () => {
  it('starts the player in a lane, not on a divider', () => {
    // DESIGN_WIDTH / 2 is the intuitive answer and is a divider on an even
    // lane count. This shipped, and looked wrong the moment it was seen.
    expect(LANE_CENTRES).toContain(START_X);
    expect(START_X).not.toBe(DESIGN_WIDTH / 2);
  });

  it('tiles the road exactly, with no gap or overhang', () => {
    expect(LANE_WIDTH * LANE_COUNT).toBe(DESIGN_WIDTH);
    expect(LANE_CENTRES[0]).toBeCloseTo(LANE_WIDTH / 2);
    expect(LANE_CENTRES[LANE_COUNT - 1]).toBeCloseTo(DESIGN_WIDTH - LANE_WIDTH / 2);
  });
});

describe('the fleet', () => {
  it('keeps every vehicle narrower than a lane', () => {
    // a vehicle wider than its lane cannot be dodged, only survived
    for (const id of [...PLAYER_IDS, ...TRAFFIC_IDS]) {
      const car = id in PLAYERS ? PLAYERS[id as never] : TRAFFIC[id as never];
      expect({ id, width: (car as { width: number }).width }).toMatchObject({
        width: expect.any(Number)
      });
      expect((car as { width: number }).width).toBeLessThan(LANE_WIDTH);
    }
  });

  it('derives slimness monotonically from width, within the meter range', () => {
    const widths = PLAYER_IDS.map((id) => PLAYERS[id].width).sort((a, b) => a - b);
    const scores = widths.map(slimness);
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(6);
    }
    // narrower must never score worse than wider, or the stat lies
    for (let i = 1; i < scores.length; i += 1) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it('orders traffic threat by footprint', () => {
    // the difficulty curve IS the footprint curve; if these disagree, the
    // threat number on the design sheet is decoration
    const byThreat = [...TRAFFIC_IDS].sort((a, b) => TRAFFIC[a].threat - TRAFFIC[b].threat);
    const areas = byThreat.map((id) => TRAFFIC[id].width * TRAFFIC[id].length);
    for (let i = 1; i < areas.length; i += 1) {
      expect(areas[i]).toBeGreaterThanOrEqual(areas[i - 1]);
    }
  });

  it('prices unlocks above the free starter', () => {
    const free = PLAYER_IDS.filter((id) => PLAYERS[id].cost === 0);
    expect(free).toEqual(['straycat']);
  });

  it('charges most for the car that fits the smallest gap', () => {
    // width is the stat that decides whether a gap is passable, so price has to
    // follow it. It did not: the 46pt Hatpin was the cheapest unlock at 600
    // while the 68pt Donkey Work cost 1800, which made coins buy the best car
    // first and every later purchase a downgrade.
    const paid = PLAYER_IDS.filter((id) => PLAYERS[id].cost > 0).sort(
      (a, b) => PLAYERS[a].cost - PLAYERS[b].cost
    );
    const widths = paid.map((id) => PLAYERS[id].width);
    for (let i = 1; i < widths.length; i += 1) {
      expect(widths[i]).toBeLessThan(widths[i - 1]);
    }
  });
});

describe('save narrowing', () => {
  it('survives junk instead of throwing', () => {
    for (const junk of [null, undefined, 42, 'nope', [], {}]) {
      expect(() => revive(junk)).not.toThrow();
    }
    expect(revive(null).equipped).toBe('straycat');
  });

  it('drops cars that no longer exist and never strands the player', () => {
    const save = revive({ owned: ['hatpin', 'delorean'], equipped: 'delorean', coins: 10 });
    expect(save.owned).not.toContain('delorean');
    expect(save.owned).toContain('straycat');
    // equipping a car you don't own would render an empty garage
    expect(save.owned).toContain(save.equipped);
  });

  it('brings every old control scheme back as drag', () => {
    // tap-lanes and tilt were offered in settings and never implemented, so a
    // save holding one describes a player who was getting drag regardless
    for (const control of ['telepathy', 'tapLanes', 'tilt', undefined]) {
      expect(revive({ control }).control).toBe('drag');
    }
  });

  it('treats a missing audio flag as on, not off', () => {
    // `value.x !== false` and `!!value.x` differ here, and getting it wrong
    // silently mutes a returning player
    expect(revive({}).music).toBe(true);
    expect(revive({ music: false }).music).toBe(false);
  });
});

describe('pickups', () => {
  it('keeps every pickup far smaller than the narrowest car', () => {
    // a pickup the size of traffic costs the player a swerve they never needed
    // to make; it has to read as "collect", not "avoid", in peripheral vision
    const narrowest = Math.min(...TRAFFIC_IDS.map((id) => TRAFFIC[id].width));
    for (const id of PICKUP_IDS) {
      expect(PICKUPS[id].size).toBeLessThan(narrowest * 0.8);
    }
  });

  it('gives every pickup something to be worth', () => {
    // a pickup worth nothing is scenery the player wastes a lane change on
    for (const id of PICKUP_IDS) {
      const spec = PICKUPS[id];
      if (spec.kind === 'coin') expect(spec.value).toBeGreaterThan(0);
      else expect(spec.seconds).toBeGreaterThan(0);
    }
  });

  it('hands every pickup to the rasteriser', () => {
    // sprites are pre-rasterised from this manifest; a pickup missing from it
    // spawns into the world and throws on the first frame that draws it
    const drawable = new Set(SPRITE_MANIFEST.map(([id]) => id));
    for (const id of PICKUP_IDS) {
      expect(drawable).toContain(id);
    }
  });

  it('forgives collection while punishing collision', () => {
    // the two hitboxes lean opposite ways on purpose: clipping a wing mirror
    // should not end a run, and brushing a coin should still bank it
    expect(HITBOX_INSET).toBeLessThan(1);
  });
});

describe('power-ups', () => {
  it('slows the road rather than speeding it up', () => {
    // the name promises one direction; a scale above 1 would be a trap dressed
    // as a reward, and the player has no way to refuse a pickup once taken
    expect(SLOWMO_SCALE).toBeGreaterThan(0);
    expect(SLOWMO_SCALE).toBeLessThan(1);
  });

  it('reaches further with a magnet than the player can without one', () => {
    // if the reach were inside the collection box the power would do nothing
    // visible, and the player would think it had failed
    const widest = Math.max(...PLAYER_IDS.map((id) => PLAYERS[id].width));
    expect(MAGNET_REACH).toBeGreaterThan(widest);
  });

  it('labels every power for the HUD pill', () => {
    // the pill shows a name beside a countdown; a blank one reads as a bug
    for (const id of POWER_IDS) {
      const spec = PICKUPS[id];
      expect(spec.kind).toBe('power');
      if (spec.kind === 'power') expect(spec.label.length).toBeGreaterThan(0);
    }
  });

  it('keeps every power off the banking path a coin uses', () => {
    // coins bank a value and powers start a clock; one spec doing both would
    // mean a power silently paying out, or a coin silently arming something
    for (const id of POWER_IDS) {
      expect(PICKUPS[id]).not.toHaveProperty('value');
    }
  });
});

describe('power availability', () => {
  it('keeps every unlock threshold inside the ramp', () => {
    // `from` is compared against pressure, which is clamped to 0..1; a value
    // above 1 is a power that can never drop, and reads as a missing feature
    for (const id of POWER_IDS) {
      const spec = PICKUPS[id];
      if (spec.kind !== 'power') continue;
      expect(spec.from).toBeGreaterThanOrEqual(0);
      expect(spec.from).toBeLessThanOrEqual(1);
    }
  });

  it('offers at least one power from the first metre', () => {
    // if every power were gated behind some distance, an early run would show
    // none at all and the whole system would look unimplemented
    const immediate = POWER_IDS.filter((id) => {
      const spec = PICKUPS[id];
      return spec.kind === 'power' && spec.from === 0;
    });
    expect(immediate.length).toBeGreaterThan(0);
  });

  it('holds slow-mo back until slowing down would actually help', () => {
    // it scales an already-slow road at the start, so an early one is a dud
    const spec = PICKUPS.slowmo;
    expect(spec.kind).toBe('power');
    if (spec.kind === 'power') expect(spec.from).toBeGreaterThan(0);
  });
});

describe('near-miss combo', () => {
  it('puts the near-miss band outside the crash box but inside a lane', () => {
    // inside the crash box it could never fire, since contact ends the run
    // first; wider than a lane and simply driving straight would score one
    expect(NEAR_MISS_MARGIN).toBeGreaterThan(0);
    expect(NEAR_MISS_MARGIN).toBeLessThan(LANE_WIDTH);
  });

  it('gives a streak long enough to chain but short enough to lose', () => {
    // at full speed cars arrive roughly every 0.34s, so a window under that
    // could never chain, and one several seconds long would never drop
    expect(COMBO_WINDOW).toBeGreaterThan(0.34);
    expect(COMBO_WINDOW).toBeLessThan(10);
  });

  it('defaults the combo on a run recorded before combos existed', () => {
    // a returning player's lastRun has no bestCombo; the summary must not
    // render "×undefined"
    const save = revive({ lastRun: { coins: 3, distance: 900, isBest: false, score: 400 } });
    expect(save.lastRun?.bestCombo).toBe(1);
  });

  it('keeps a junk run summary from reaching the screen', () => {
    expect(revive({ lastRun: 'nope' }).lastRun).toBeNull();
  });
});

describe('shop upgrades', () => {
  it('charges more for each level than the one before', () => {
    // a flat or falling curve makes the last level the cheapest, so a player
    // buys top-down and the early levels never sell
    for (const id of UPGRADE_IDS) {
      const costs = UPGRADES[id].costs;
      for (let i = 1; i < costs.length; i += 1) {
        expect(costs[i]).toBeGreaterThan(costs[i - 1]);
      }
    }
  });

  it('prices every upgrade below the cheapest unlockable car', () => {
    // upgrades are the near-term sink and cars the long goal; if a level cost
    // more than a car, coins would only ever go one way
    const cheapest = Math.min(...PLAYER_IDS.map((id) => PLAYERS[id].cost).filter((c) => c > 0));
    for (const id of UPGRADE_IDS) {
      expect(Math.max(...UPGRADES[id].costs)).toBeLessThan(cheapest);
    }
  });

  it('stops selling at the top level', () => {
    for (const id of UPGRADE_IDS) {
      expect(nextCost(id, maxLevel(id))).toBeNull();
      expect(nextCost(id, 0)).toBe(UPGRADES[id].costs[0]);
    }
  });

  it('makes every level strictly better than the last', () => {
    // an upgrade that changes nothing is a coin sink that lies
    for (const id of UPGRADE_IDS) {
      for (let level = 1; level <= maxLevel(id); level += 1) {
        const before = effectOf(id, { ...FRESH_UPGRADES, [id]: level - 1 });
        const after = effectOf(id, { ...FRESH_UPGRADES, [id]: level });
        expect(after).toBeGreaterThan(before);
      }
    }
  });

  it('buys the magnet reach rather than magnet time', () => {
    // its upgrade widens the pull; the duration is whatever the pickup says
    const maxed = { ...FRESH_UPGRADES, magnet: maxLevel('magnet') };
    expect(magnetReach(maxed)).toBeGreaterThan(magnetReach(FRESH_UPGRADES));
    expect(powerSeconds('magnet', maxed)).toBe(powerSeconds('magnet', FRESH_UPGRADES));
  });

  it('clamps a tampered save to levels the shop can sell', () => {
    // a level above the cap would hand out an effect nobody paid for, and a
    // fractional one feeds NaN into a power's duration
    const save = revive({ upgrades: { shield: 99, magnet: -4, slowmo: 1.7 } });
    expect(save.upgrades.shield).toBe(maxLevel('shield'));
    expect(save.upgrades.magnet).toBe(0);
    expect(save.upgrades.slowmo).toBe(1);
  });

  it('gives a save with no upgrades a full set at zero', () => {
    expect(revive({}).upgrades).toEqual(FRESH_UPGRADES);
    expect(revive({ upgrades: 'nope' }).upgrades).toEqual(FRESH_UPGRADES);
  });
});
