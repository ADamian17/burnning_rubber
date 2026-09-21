import { seedFrom } from '../../lib/rng';
import type { FinishedRun } from '../../game/run';

/** What a day's challenge asks for. All three are already on a FinishedRun. */
export type DailyGoal = 'coins' | 'combo' | 'distance';

export interface Challenge {
  readonly goal: DailyGoal;
  /** Shown as the title, e.g. LONG HAUL. */
  readonly name: string;
  readonly note: string;
  /** Coins paid for completing it. */
  readonly reward: number;
  readonly target: number;
}

export interface DailyState {
  /** UTC date of the most recent completion, as YYYY-MM-DD, or null. */
  lastDone: string | null;
  streak: number;
}

export const FRESH_DAILY: DailyState = { lastDone: null, streak: 0 };

/**
 * Today, in UTC.
 *
 * UTC rather than local time so the challenge changes at the same instant
 * everywhere. On local time two players in different zones would be driving
 * different roads while both called it "today", which is the one thing a shared
 * daily cannot do.
 */
export const dayKey = (now: Date = new Date()): string => now.toISOString().slice(0, 10);

/** The day before a key, for deciding whether a streak survived. */
const dayBefore = (key: string): string => {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return dayKey(date);
};

/** Seconds until the next challenge, for the countdown. */
export const secondsUntilNextDay = (now: Date = new Date()): number => {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
};

const SHAPES: ReadonlyArray<(step: number) => Challenge> = [
  (step) => ({
    goal: 'distance',
    name: 'LONG HAUL',
    note: `Cover ${(0.6 + step * 0.25).toFixed(2)}km in a single run.`,
    reward: 150 + step * 40,
    target: (0.6 + step * 0.25) * 1000
  }),
  (step) => ({
    goal: 'coins',
    name: 'PAYDAY',
    note: `Bank ${12 + step * 5} coins in a single run.`,
    reward: 140 + step * 35,
    target: 12 + step * 5
  }),
  (step) => ({
    goal: 'combo',
    name: 'ON FIRE',
    note: `Reach a ×${3 + step} combo without crashing.`,
    reward: 170 + step * 45,
    target: 3 + step
  })
];

/**
 * The challenge for a given day.
 *
 * Derived from the date rather than stored, so every player gets the same one
 * without anything being fetched, and yesterday's can always be recomputed.
 * Difficulty steps 0-3 off the same hash, so a day is not only a different goal
 * but a different size of goal.
 */
export const challengeFor = (key: string): Challenge => {
  const hash = seedFrom(key);
  return SHAPES[hash % SHAPES.length]((hash >>> 8) % 4);
};

/** The seed the day's road is built from. */
export const seedForDay = (key: string): number => seedFrom(key);

/** Whether a finished run met the day's challenge. */
export const met = (challenge: Challenge, run: FinishedRun): boolean => {
  if (challenge.goal === 'coins') return run.coins >= challenge.target;
  if (challenge.goal === 'combo') return run.bestCombo >= challenge.target;
  return run.distance >= challenge.target;
};

/** How far a finished run got, in the challenge's own units. */
export const progressOf = (challenge: Challenge, run: FinishedRun): number => {
  if (challenge.goal === 'coins') return run.coins;
  if (challenge.goal === 'combo') return run.bestCombo;
  return run.distance;
};

/**
 * The streak after completing `key`.
 *
 * Consecutive days build it; a missed day resets to 1 rather than 0, because
 * the day just completed still counts. Completing the same day twice cannot
 * happen — the caller checks `lastDone` first — but is treated as a no-op
 * rather than a double increment, so a replayed save cannot inflate it.
 */
export const streakAfter = (daily: DailyState, key: string): number => {
  if (daily.lastDone === key) return daily.streak;
  return daily.lastDone === dayBefore(key) ? daily.streak + 1 : 1;
};
