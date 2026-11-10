import { describe, expect, it } from 'vitest';
import { nextRandom, randomInt } from './rng';

describe('nextRandom', () => {
  it('gives the same numbers for the same seed', () => {
    expect(nextRandom(42)).toEqual(nextRandom(42));
    expect(nextRandom(42).value).not.toBe(nextRandom(43).value);
  });

  it('stays between 0 and 1 and moves the seed on', () => {
    let seed = 1;
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const result = nextRandom(seed);
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThan(1);
      seen.add(result.value);
      seed = result.seed;
    }
    expect(seen.size).toBeGreaterThan(490);
  });
});

describe('randomInt', () => {
  it('covers the whole range, including both ends', () => {
    let seed = 7;
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const result = randomInt(seed, 2, 4);
      seen.add(result.value);
      seed = result.seed;
    }
    expect([...seen].sort()).toEqual([2, 3, 4]);
  });
});
