import { applyAction, type Action } from '../engine/game';
import { createGame, type GameState } from '../engine/state';

/** The seed used by tests and by the Playwright journey. */
export const TEST_SEED = 42;

export function newGame(overrides: Partial<GameState> = {}): GameState {
  return { ...createGame({ seed: TEST_SEED }), ...overrides };
}

export function play(state: GameState, ...actions: Action[]): GameState {
  return actions.reduce(applyAction, state);
}

/** A game with the shop open and plenty of every ingredient. */
export function openGame(overrides: Partial<GameState> = {}): GameState {
  const stocked = newGame({ ingredients: { flour: 10, sugar: 10, butter: 10, egg: 10 } });
  return { ...play(stocked, { type: 'openShop' }), ...overrides };
}
