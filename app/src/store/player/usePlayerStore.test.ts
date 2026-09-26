import { beforeEach, describe, expect, it, vi } from 'vitest';
import { challengeFor, dayKey } from '../../features/daily/challenge';
import { PLAYERS } from '../../game/fleet';
import { revive } from './save';
import { UPGRADES, maxLevel } from '../../game/upgrades';
import { usePlayerStore } from './usePlayerStore';

/*
 * Writing to storage is not what these check, and Capacitor's Preferences needs
 * a window that a node test does not have. Stubbed so the rules can be tested
 * without a DOM.
 */
vi.mock('./save', async () => {
  const real = await vi.importActual<typeof import('./save')>('./save');
  return {
    ...real,
    // the whole adapter, not the read/write pair it used to wrap — those are
    // inside it now, and leaving the real one in place reaches for Preferences
    playerStorage: {
      getItem: vi.fn(async () => ({ state: real.revive(null) })),
      removeItem: vi.fn(async () => {}),
      setItem: vi.fn(async () => {}),
    },
  };
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
  usePlayerStore.setState({ ...revive(null), ...patch });

const save = () => usePlayerStore.getState();

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
    /*
     * Big enough to clear any of the three goals, the coin one included — the
     * day's challenge is picked by hashing the UTC date, so which goal this has
     * to beat depends on when the test runs. It used to bank `coins: 0`, which
     * cannot meet a PAYDAY target, so it failed on roughly one day in three.
     *
     * Banking coins means the balance is the run's take plus the reward, not the
     * reward alone; asserting the difference is what keeps this about the payout.
     */
    const huge = { ...run, bestCombo: 99, coins: 99, distance: 99_999, score: 99_999 };

    usePlayerStore.getState().recordRun(huge, day);
    expect(save().coins).toBe(huge.coins + reward);
    expect(save().daily).toEqual({ lastDone: day, streak: 1 });

    // the same day again banks the run's coins but pays no reward, and the
    // streak does not move
    const banked = save().coins;
    usePlayerStore.getState().recordRun(huge, day);
    expect(save().coins).toBe(banked + huge.coins);
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

describe('stamping isBest', () => {
  // a FinishedRun: what the engine can report, with no isBest on it
  const finished = { bestCombo: 1, coins: 0, distance: 100, score: 0 };

  /*
   * The engine reports a FinishedRun, which has no isBest — it cannot know what
   * the score had to beat. The store adds it, and getting the comparison
   * backwards would put NEW BEST! on every summary.
   */
  it('marks a run that beat the previous best', () => {
    start({ best: 100 });
    usePlayerStore.getState().recordRun({ ...finished, score: 101 }, null);
    expect(save().lastRun?.isBest).toBe(true);
    expect(save().best).toBe(101);
  });

  it('does not mark a run that only equalled it', () => {
    start({ best: 100 });
    usePlayerStore.getState().recordRun({ ...finished, score: 100 }, null);
    expect(save().lastRun?.isBest).toBe(false);
    expect(save().best).toBe(100);
  });

  it('does not mark a worse run, and leaves the best alone', () => {
    start({ best: 100 });
    usePlayerStore.getState().recordRun({ ...finished, score: 40 }, null);
    expect(save().lastRun?.isBest).toBe(false);
    expect(save().best).toBe(100);
  });
});

describe('reset', () => {
  it('wipes progress but leaves the player onboarded', () => {
    // sitting through the tutorial again is a punishment for using a settings
    // button
    start({ best: 900, coins: 400, onboarded: true, owned: ['straycat', 'hatpin'] });
    usePlayerStore.getState().reset();
    expect(save().best).toBe(0);
    expect(save().coins).toBe(0);
    expect(save().owned).toEqual(['straycat']);
    expect(save().onboarded).toBe(true);
  });
});
