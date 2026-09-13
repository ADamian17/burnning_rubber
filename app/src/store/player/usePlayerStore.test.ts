import { beforeEach, describe, expect, it, vi } from 'vitest';
import { challengeFor, dayKey } from '../../game/daily';
import { PLAYERS } from '../../game/fleet';
import { revive } from '../../game/state';
import { UPGRADES, maxLevel } from '../../game/upgrades';
import { usePlayerStore } from './usePlayerStore';

/*
 * Writing to storage is not what these check, and Capacitor's Preferences needs
 * a window that a node test does not have. Stubbed so the rules can be tested
 * without a DOM.
 */
vi.mock('../../game/state', async () => {
  const real = await vi.importActual<typeof import('../../game/state')>('../../game/state');
  return { ...real, resetState: vi.fn(async () => revive(null)), saveState: vi.fn(async () => {}) };
});

/**
 * The rules the save enforces.
 *
 * These were only reachable through the browser before: buying a car lived in
 * the garage's click handler and buying an upgrade in the shop's, so the only
 * way to check that an unaffordable purchase is refused was to drive a page.
 * Moving them into the store is what makes them testable at all.
 */
const start = (patch: Partial<ReturnType<typeof revive>> = {}) =>
  usePlayerStore.setState({ save: { ...revive(null), ...patch } });

const save = () => usePlayerStore.getState().save;

beforeEach(() => start());

describe('buying a car', () => {
  it('deducts the price, owns it, and equips it', () => {
    start({ coins: 5000 });
    usePlayerStore.getState().buyCar('hatpin');
    expect(save().coins).toBe(5000 - PLAYERS.hatpin.cost);
    expect(save().owned).toContain('hatpin');
    expect(save().equipped).toBe('hatpin');
  });

  it('refuses a car it cannot afford, and changes nothing', () => {
    start({ coins: PLAYERS.hatpin.cost - 1 });
    usePlayerStore.getState().buyCar('hatpin');
    expect(save().owned).not.toContain('hatpin');
    expect(save().coins).toBe(PLAYERS.hatpin.cost - 1);
  });

  it('will not charge twice for a car already owned', () => {
    // the button should not offer this, but a stale render might
    start({ coins: 5000, owned: ['straycat', 'hatpin'] });
    usePlayerStore.getState().buyCar('hatpin');
    expect(save().coins).toBe(5000);
  });
});

describe('buying an upgrade', () => {
  it('deducts and raises the level', () => {
    start({ coins: 5000 });
    usePlayerStore.getState().buyUpgrade('shield');
    expect(save().upgrades.shield).toBe(1);
    expect(save().coins).toBe(5000 - UPGRADES.shield.costs[0]);
  });

  it('stops selling at the top level', () => {
    const top = maxLevel('shield');
    start({ coins: 99_000, upgrades: { magnet: 0, shield: top, slowmo: 0 } });
    usePlayerStore.getState().buyUpgrade('shield');
    expect(save().upgrades.shield).toBe(top);
    expect(save().coins).toBe(99_000);
  });

  it('refuses one it cannot afford', () => {
    start({ coins: 0 });
    usePlayerStore.getState().buyUpgrade('magnet');
    expect(save().upgrades.magnet).toBe(0);
  });
});

describe('recording a run', () => {
  const run = { bestCombo: 9, coins: 12, distance: 4000, isBest: false, score: 900 };

  it('banks coins and keeps the higher best', () => {
    start({ best: 5000, coins: 100 });
    usePlayerStore.getState().recordRun(run, null);
    expect(save().coins).toBe(112);
    // a worse run must not lower the best
    expect(save().best).toBe(5000);
  });

  it('pays the daily once and starts the streak', () => {
    const day = dayKey();
    const reward = challengeFor(day).reward;
    start({ coins: 0 });
    // a run big enough to clear any of the three goals
    const huge = { ...run, bestCombo: 99, coins: 0, distance: 99_999, score: 99_999 };

    usePlayerStore.getState().recordRun(huge, day);
    expect(save().coins).toBe(reward);
    expect(save().daily).toEqual({ lastDone: day, streak: 1 });

    // the same day again pays nothing and does not bump the streak
    usePlayerStore.getState().recordRun(huge, day);
    expect(save().coins).toBe(reward);
    expect(save().daily.streak).toBe(1);
  });

  it('pays nothing for a daily run that missed the goal', () => {
    const day = dayKey();
    start({ coins: 0 });
    usePlayerStore.getState().recordRun({ ...run, bestCombo: 1, coins: 0, distance: 0, score: 0 }, day);
    expect(save().coins).toBe(0);
    expect(save().daily.lastDone).toBeNull();
  });
});

describe('reset', () => {
  it('wipes progress but leaves the player onboarded and their switches alone', () => {
    // sitting through the tutorial again is a punishment for using a settings
    // button, and a reset is not a statement about wanting the sound off
    start({ best: 900, coins: 400, music: false, onboarded: true, owned: ['straycat', 'hatpin'] });
    usePlayerStore.getState().reset();
    expect(save().best).toBe(0);
    expect(save().coins).toBe(0);
    expect(save().owned).toEqual(['straycat']);
    expect(save().onboarded).toBe(true);
    expect(save().music).toBe(false);
  });
});

describe('flags', () => {
  it('toggles each independently', () => {
    usePlayerStore.getState().toggle('music');
    expect(save().music).toBe(false);
    expect(save().sfx).toBe(true);
    usePlayerStore.getState().toggle('music');
    expect(save().music).toBe(true);
  });
});
