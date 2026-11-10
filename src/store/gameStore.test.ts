import { afterEach, describe, expect, it, vi } from 'vitest';
import { at, customer, openGame } from '../test/fixtures';
import { MAX_FRAME_MS, useGameStore } from './gameStore';
import { leavingAfter, MAX_LEAVING } from './leaving';
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
    store().dispatch({ type: 'closePanel' });
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

  it('passes the baker look on to the game', () => {
    store().startNewGame({ bakeryName: 'Bun Fun', playerName: 'Ada', bakerLook: 'baker-4' });
    expect(store().game?.bakerLook).toBe('baker-4');
  });

  it('dispatches actions to the engine', () => {
    start();
    store().dispatch({ type: 'tap', target: { kind: 'thing', id: 'door' } });
    expect(store().game?.baker.walk).not.toBeNull();
  });

  it('ticks the engine, and never jumps far ahead after a long frame', () => {
    start();
    useGameStore.setState({ game: openGame() });
    store().tick(100);
    expect(store().game?.clockMs).toBe(100);
    store().tick(60_000);
    expect(store().game?.clockMs).toBe(100 + MAX_FRAME_MS);
  });

  it('remembers customers who have just left, and forgets them in a new game', () => {
    useGameStore.setState({
      screen: 'game',
      game: openGame({
        ...at('bakery', 'counter'),
        shelf: { cookie: 1, muffin: 0, bread: 0 },
        customers: [customer(1, 'cookie')],
      }),
    });
    store().dispatch({ type: 'tap', target: { kind: 'customer', id: 1 } });
    expect(store().leaving).toEqual([{ id: 1, queueIndex: 0, mood: 'happy' }]);
    start();
    expect(store().leaving).toEqual([]);
  });

  it('uses the seed and speed test hooks when they are switched on', () => {
    vi.stubEnv('VITE_TEST_HOOKS', 'true');
    window.history.replaceState(null, '', '/?seed=42&speed=4');
    start();
    expect(store().game?.rng).toBe(42);
    useGameStore.setState({ game: openGame() });
    store().tick(100);
    expect(store().game?.clockMs).toBe(400);
  });
});

describe('leavingAfter', () => {
  const queue = openGame({
    customers: [customer(1, 'cookie'), customer(2, 'bread'), customer(3, 'muffin')],
  });
  const without = (...ids: number[]) => queue.customers.filter((c) => !ids.includes(c.id));

  it('changes nothing when nobody has left', () => {
    const leaving = [{ id: 9, queueIndex: 0, mood: 'calm' as const }];
    expect(leavingAfter(queue, { ...queue, clockMs: 5 }, leaving)).toBe(leaving);
  });

  it('a customer who was served leaves happy, from their place in the queue', () => {
    const after = {
      ...queue,
      customers: without(2),
      today: { ...queue.today, happyCustomers: 1 },
    };
    expect(leavingAfter(queue, after, [])).toEqual([{ id: 2, queueIndex: 1, mood: 'happy' }]);
  });

  it('customers who gave up leave grumpy', () => {
    const after = { ...queue, customers: without(1, 3) };
    expect(leavingAfter(queue, after, [])).toEqual([
      { id: 1, queueIndex: 0, mood: 'grumpy' },
      { id: 3, queueIndex: 2, mood: 'grumpy' },
    ]);
  });

  it('everyone leaves calmly at closing time', () => {
    const after = { ...queue, phase: 'evening' as const, customers: [] };
    expect(leavingAfter(queue, after, []).map((l) => l.mood)).toEqual(['calm', 'calm', 'calm']);
  });

  it('only remembers the last few', () => {
    const old = [7, 8, 9].map((id) => ({ id, queueIndex: 0, mood: 'calm' as const }));
    const leaving = leavingAfter(queue, { ...queue, customers: without(1, 2) }, old);
    expect(leaving).toHaveLength(MAX_LEAVING);
    expect(leaving.map((l) => l.id)).toEqual([8, 9, 1, 2]);
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
