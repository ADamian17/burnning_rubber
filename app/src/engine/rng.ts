/**
 * A seeded pseudo-random generator.
 *
 * The daily challenge only means anything if every player drives the same road,
 * which `Math.random` cannot give — it has no seed and no reproducibility. This
 * is mulberry32: thirty-two bits of state, four operations, good enough
 * statistical quality for traffic placement, and small enough not to be worth a
 * dependency.
 *
 * It is used for *every* run, not just dailies. A seeded path for one mode and
 * `Math.random` for the other would mean the daily exercises code no one plays
 * the rest of the time, and the first bug in it would surface on the one day it
 * matters to everybody at once.
 */
export type Rng = () => number;

/** Deterministic from `seed`; returns the half-open interval [0, 1). */
export const createRng = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Hash text to a seed, so a date string can name a road.
 *
 * FNV-1a. Chosen over summing char codes because that collides immediately on
 * anagrams — "2026-01-02" and "2026-02-01" would hand out the same day twice.
 */
export const seedFrom = (text: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** A seed with no reproducibility, for ordinary runs. */
export const randomSeed = (): number => (Math.random() * 0x100000000) >>> 0;

/** Integer in [0, count). */
export const pick = (rng: Rng, count: number): number => Math.floor(rng() * count);
