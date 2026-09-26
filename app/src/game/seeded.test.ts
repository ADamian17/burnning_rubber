import { describe, expect, it } from 'vitest';
import { STEP } from '../features/run/loop';
import { createRng, seedFrom } from '../lib/rng';
import { challengeFor, dayKey, met, seedForDay, streakAfter, FRESH_DAILY } from '../features/daily/challenge';
import { createGame } from './game';
import { FRESH_UPGRADES } from './upgrades';
import type { SpriteSheet } from '../features/run/sprites';
import type { SpriteId } from './fleet';
import type { Stage } from '../features/run/canvas';

/**
 * Determinism tests for the seeded road.
 *
 * These drive the real game rather than asserting around it, because the thing
 * being checked is exactly that nothing anywhere in the update path reaches for
 * an unseeded source. A structural test — "no Math.random appears in this file"
 * — would pass the day someone adds one in a module it calls.
 *
 * `update` touches neither the canvas context nor the sprite sheet, so both can
 * be stubs; only `render` needs them.
 */
const stage = (): Stage => ({
  ctx: {} as CanvasRenderingContext2D,
  dpr: 1,
  height: 852,
  // never called here: `update` does not measure, and nothing resizes a stub
  resize: () => {},
  width: 393
});

const sprites = {} as SpriteSheet<SpriteId>;

/** Runs a game forward and records the shape of the road it produced. */
const roadFrom = (seed: number, steps = 900): string => {
  const game = createGame({ car: 'straycat', seed, sprites, stage: stage(), upgrades: FRESH_UPGRADES });
  const trace: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    game.update(STEP);
    /*
     * Traffic on the road and coins taken, not distance or score.
     *
     * Those two are pure functions of elapsed time while the car sits still, so
     * they match across seeds no matter how the road differs — the first version
     * of this test compared them and could not tell two seeds apart.
     */
    if (i % 45 === 0) trace.push(`${game.cars}:${game.coins}`);
  }
  return trace.join('|');
};

describe('seeded runs', () => {
  it('lays out the same road twice from the same seed', () => {
    // the whole point of a daily: two players, one road
    expect(roadFrom(12345)).toBe(roadFrom(12345));
  });

  it('lays out a different road from a different seed', () => {
    // a generator that ignored its seed would pass the test above perfectly
    expect(roadFrom(12345)).not.toBe(roadFrom(99999));
  });

  it('turns a date into a stable seed', () => {
    expect(seedFrom('2026-09-13')).toBe(seedFrom('2026-09-13'));
    expect(seedFrom('2026-09-13')).not.toBe(seedFrom('2026-09-14'));
  });

  it('does not collide on transposed dates', () => {
    // summing char codes would hand these the same road, and the collision
    // would only show up on the two days it happened
    expect(seedFrom('2026-01-02')).not.toBe(seedFrom('2026-02-01'));
  });

  it('stays inside [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 2000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('spreads across the range rather than clustering', () => {
    // a generator stuck in a corner would still be deterministic, and would
    // put every car in the same lane for the whole run
    const rng = createRng(2026);
    const buckets = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i += 1) buckets[Math.floor(rng() * 4)] += 1;
    for (const count of buckets) {
      expect(count).toBeGreaterThan(800);
      expect(count).toBeLessThan(1200);
    }
  });
});

describe('daily challenge', () => {
  it('gives the same road and goal to everyone on a day', () => {
    // the whole promise of a daily: no fetch, no server, same day same road
    expect(seedForDay('2026-09-13')).toBe(seedForDay('2026-09-13'));
    expect(challengeFor('2026-09-13')).toEqual(challengeFor('2026-09-13'));
  });

  it('changes the challenge from day to day', () => {
    const week = ['2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16'];
    const seeds = new Set(week.map(seedForDay));
    expect(seeds.size).toBe(week.length);
  });

  it('keys the day in UTC', () => {
    // local time would put two players on different roads while both called it
    // today, which is the one thing a shared daily cannot do
    expect(dayKey(new Date('2026-09-13T23:59:00Z'))).toBe('2026-09-13');
    expect(dayKey(new Date('2026-09-14T00:01:00Z'))).toBe('2026-09-14');
  });

  it('only counts a run that actually met the goal', () => {
    const challenge = challengeFor('2026-09-13');
    const run = { bestCombo: 1, coins: 0, distance: 0, isBest: false, score: 0 };
    expect(met(challenge, run)).toBe(false);
    expect(
      met(challenge, {
        ...run,
        bestCombo: 99,
        coins: 9999,
        distance: 99999
      })
    ).toBe(true);
  });

  it('builds a streak on consecutive days and resets after a gap', () => {
    const on = (lastDone: string | null, streak: number) => ({ lastDone, streak });
    expect(streakAfter(on('2026-09-12', 4), '2026-09-13')).toBe(5);
    // a missed day resets to 1, not 0 — the day just completed still counts
    expect(streakAfter(on('2026-09-10', 4), '2026-09-13')).toBe(1);
    expect(streakAfter(FRESH_DAILY, '2026-09-13')).toBe(1);
  });

  it('cannot be claimed twice on the same day', () => {
    // a replayed save must not inflate the streak
    expect(streakAfter({ lastDone: '2026-09-13', streak: 6 }, '2026-09-13')).toBe(6);
  });

  it('carries a streak across a month boundary', () => {
    // naive date arithmetic breaks here, and it only breaks once a month
    expect(streakAfter({ lastDone: '2026-08-31', streak: 3 }, '2026-09-01')).toBe(4);
  });
});
