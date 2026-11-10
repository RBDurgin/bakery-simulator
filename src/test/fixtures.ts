import type { IngredientId } from '../content/ingredients';
import type { PlaceId } from '../content/places';
import { applyAction, tick, type Action } from '../engine/game';
import { createGame, type Customer, type GameState } from '../engine/state';

/** The seed used by tests and by the Playwright journey. */
export const TEST_SEED = 42;

/** A new game with no message, so tests can check the messages they cause. */
export function newGame(overrides: Partial<GameState> = {}): GameState {
  return { ...createGame({ seed: TEST_SEED }), message: null, ...overrides };
}

export function play(state: GameState, ...actions: Action[]): GameState {
  return actions.reduce(applyAction, state);
}

/** Puts the baker on a spot, standing still. */
export function at(place: PlaceId, spot: string): Pick<GameState, 'baker'> {
  return { baker: { place, spot, walk: null } };
}

/** Taps a thing in the baker's place. */
export function tapThing(state: GameState, id: string): GameState {
  return applyAction(state, { type: 'tap', target: { kind: 'thing', id } });
}

export function tapCustomer(state: GameState, id: number): GameState {
  return applyAction(state, { type: 'tap', target: { kind: 'customer', id } });
}

/** Lets a walk finish. Stop the customers first if the test should not see any arrive. */
export function arrive(state: GameState): GameState {
  let current = state;
  for (let i = 0; i < 100 && current.baker.walk; i++) current = tick(current, 100);
  return current;
}

/** Taps a thing and lets the baker walk there. */
export function goTo(state: GameState, id: string): GameState {
  return arrive(tapThing(state, id));
}

export const customer = (id: number, wants: Customer['wants'], waitedMs = 0): Customer => ({
  id,
  wants,
  waitedMs,
});

/** A morning game with the panel of a market stall open. */
export function stallGame(ingredientId: IngredientId, overrides: Partial<GameState> = {}) {
  return newGame({
    ...at('market', ingredientId),
    panel: { type: 'stall', ingredientId },
    ...overrides,
  });
}

/**
 * A game with the shop open, plenty of every ingredient, and the baker
 * standing at the shelf. No customer comes unless the test asks for one.
 */
export function openGame(overrides: Partial<GameState> = {}): GameState {
  return newGame({
    ...at('bakery', 'shelf'),
    phase: 'open',
    ingredients: { flour: 10, sugar: 10, butter: 10, egg: 10 },
    nextCustomerInMs: 1e9,
    ...overrides,
  });
}

/** An evening game: the shop has closed and the baker is at the shelf. */
export function eveningGame(overrides: Partial<GameState> = {}): GameState {
  return newGame({ ...at('bakery', 'shelf'), phase: 'evening', ...overrides });
}
