import { describe, expect, it } from 'vitest';
import { DESIGN_WIDTH, LANE_CENTRES, LANE_COUNT, LANE_WIDTH, START_X } from './constants';
import { HITBOX_INSET } from './constants';
import { PICKUPS, PICKUP_IDS } from './pickups';
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

  it('defaults an unknown control scheme rather than storing it', () => {
    expect(revive({ control: 'telepathy' }).control).toBe('drag');
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
      expect(PICKUPS[id].value).toBeGreaterThan(0);
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
