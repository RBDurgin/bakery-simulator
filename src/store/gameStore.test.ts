import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_FRAME_MS, useGameStore } from './gameStore';
import { readTestHooks } from './testHooks';

const store = () => useGameStore.getState();
const start = () => store().startNewGame({ bakeryName: 'Bun Fun', playerName: 'Ada' });

afterEach(() => {
  vi.unstubAllEnvs();
  window.history.replaceState(null, '', '/');
});

describe('game store', () => {
  it('starts on the title screen with no game', () => {
    expect(store().screen).toBe('title');
    expect(store().game).toBeNull();
  });

  it('ignores actions and ticks when there is no game', () => {
    store().dispatch({ type: 'openShop' });
    store().tick(100);
    expect(store().game).toBeNull();
  });

  it('moves between the title and new game screens', () => {
    store().goTo('newGame');
    expect(store().screen).toBe('newGame');
    store().goTo('title');
    expect(store().screen).toBe('title');
  });

  it('starts a new game with the given names and a random seed', () => {
    start();
    expect(store().screen).toBe('game');
    expect(store().game).toMatchObject({ bakeryName: 'Bun Fun', playerName: 'Ada', day: 1 });
    expect(Number.isInteger(store().game?.rng)).toBe(true);
  });

  it('dispatches actions to the engine', () => {
    start();
    store().dispatch({ type: 'buyIngredient', ingredientId: 'flour' });
    expect(store().game?.ingredients.flour).toBe(1);
  });

  it('ticks the engine, and never jumps far ahead after a long frame', () => {
    start();
    store().dispatch({ type: 'openShop' });
    store().tick(100);
    expect(store().game?.clockMs).toBe(100);
    store().tick(60_000);
    expect(store().game?.clockMs).toBe(100 + MAX_FRAME_MS);
  });

  it('uses the seed and speed test hooks when they are switched on', () => {
    vi.stubEnv('VITE_TEST_HOOKS', 'true');
    window.history.replaceState(null, '', '/?seed=42&speed=4');
    start();
    expect(store().game?.rng).toBe(42);
    store().dispatch({ type: 'openShop' });
    store().tick(100);
    expect(store().game?.clockMs).toBe(400);
  });
});

describe('readTestHooks', () => {
  it('ignores URL parameters in normal builds', () => {
    expect(readTestHooks('?seed=42&speed=4')).toEqual({});
  });

  it('reads valid values and drops bad ones in test builds', () => {
    vi.stubEnv('VITE_TEST_HOOKS', 'true');
    expect(readTestHooks('?seed=42&speed=4')).toEqual({ seed: 42, speed: 4 });
    expect(readTestHooks('')).toEqual({});
    expect(readTestHooks('?seed=abc&speed=0')).toEqual({});
    expect(readTestHooks('?seed=-1&speed=1000')).toEqual({});
  });
});
