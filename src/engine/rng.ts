/**
 * Seeded random numbers (mulberry32). The seed lives in the game state, so
 * the same seed and the same actions always give the same game.
 */
export interface RandomResult {
  /** A number from 0 (inclusive) to 1 (exclusive). */
  value: number;
  /** The seed to store for the next call. */
  seed: number;
}

export function nextRandom(seed: number): RandomResult {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: next };
}

/** A whole number from min to max, both inclusive. */
export function randomInt(seed: number, min: number, max: number): RandomResult {
  const { value, seed: next } = nextRandom(seed);
  return { value: min + Math.floor(value * (max - min + 1)), seed: next };
}
