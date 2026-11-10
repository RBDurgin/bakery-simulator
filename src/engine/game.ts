import { BALANCE } from '../content/balance';
import { INGREDIENTS, INGREDIENT_IDS, type IngredientId } from '../content/ingredients';
import { RECIPES, RECIPE_IDS, type RecipeId } from '../content/recipes';
import { nextRandom, randomInt } from './rng';
import { batchesPossible, ovenStage, starsFor } from './selectors';
import { emptyDayStats, type GameState } from './state';

export type Action =
  | { type: 'buyIngredient'; ingredientId: IngredientId; quantity?: number }
  | { type: 'openShop' }
  | { type: 'startBaking'; recipeId: RecipeId }
  | { type: 'takeOut' }
  | { type: 'serveCustomer'; customerId: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'closeShop' }
  | { type: 'nextDay' };

function clampReputation(value: number): number {
  return Math.min(BALANCE.reputationMax, Math.max(0, value));
}

function addCount<K extends string>(counts: Record<K, number>, key: K, amount: number) {
  return { ...counts, [key]: counts[key] + amount };
}

function buyIngredient(state: GameState, id: IngredientId, quantity: number): GameState {
  if (state.phase !== 'morning' || !Number.isInteger(quantity) || quantity < 1) return state;
  const cost = INGREDIENTS[id].price * quantity;
  if (cost > state.money) return state;
  return {
    ...state,
    money: state.money - cost,
    ingredients: addCount(state.ingredients, id, quantity),
    today: { ...state.today, spent: state.today.spent + cost },
  };
}

function openShop(state: GameState): GameState {
  if (state.phase !== 'morning') return state;
  return {
    ...state,
    phase: 'open',
    clockMs: 0,
    paused: false,
    customers: [],
    nextCustomerInMs: BALANCE.firstCustomerDelayMs,
  };
}

function startBaking(state: GameState, recipeId: RecipeId): GameState {
  if (state.oven.status !== 'empty' || batchesPossible(state, recipeId) < 1) return state;
  const ingredients = { ...state.ingredients };
  for (const id of INGREDIENT_IDS) {
    ingredients[id] -= RECIPES[recipeId].ingredients[id] ?? 0;
  }
  return { ...state, ingredients, oven: { status: 'baking', recipeId, elapsedMs: 0 } };
}

function takeOut(state: GameState): GameState {
  if (state.oven.status === 'empty') return state;
  const { recipeId } = state.oven;
  const { batchSize } = RECIPES[recipeId];
  const stage = ovenStage(state.oven);
  if (stage === 'ready') {
    return {
      ...state,
      oven: { status: 'empty' },
      shelf: addCount(state.shelf, recipeId, batchSize),
    };
  }
  if (stage === 'burnt') {
    return {
      ...state,
      oven: { status: 'empty' },
      today: { ...state.today, wasted: addCount(state.today.wasted, recipeId, batchSize) },
    };
  }
  return state;
}

function serveCustomer(state: GameState, customerId: number): GameState {
  const customer = state.customers.find((c) => c.id === customerId);
  if (!customer || state.shelf[customer.wants] < 1) return state;
  const { price } = RECIPES[customer.wants];
  return {
    ...state,
    money: state.money + price,
    reputation: clampReputation(state.reputation + BALANCE.reputationPerHappyCustomer),
    shelf: addCount(state.shelf, customer.wants, -1),
    customers: state.customers.filter((c) => c.id !== customerId),
    today: {
      ...state.today,
      income: state.today.income + price,
      sold: addCount(state.today.sold, customer.wants, 1),
      happyCustomers: state.today.happyCustomers + 1,
    },
  };
}

/** Ends the open phase: whatever is left on the shelf or in the oven is wasted. */
function closeShop(state: GameState): GameState {
  let wasted = state.today.wasted;
  for (const id of RECIPE_IDS) {
    wasted = addCount(wasted, id, state.shelf[id]);
  }
  if (state.oven.status !== 'empty') {
    wasted = addCount(wasted, state.oven.recipeId, RECIPES[state.oven.recipeId].batchSize);
  }
  return {
    ...state,
    phase: 'evening',
    paused: false,
    customers: [],
    oven: { status: 'empty' },
    shelf: emptyDayStats().sold,
    today: { ...state.today, wasted },
  };
}

function nextDay(state: GameState): GameState {
  if (state.phase !== 'evening') return state;
  return { ...state, phase: 'morning', day: state.day + 1, clockMs: 0, today: emptyDayStats() };
}

/** The only way to change game state, apart from `tick`. Actions that are not allowed change nothing. */
export function applyAction(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'buyIngredient':
      return buyIngredient(state, action.ingredientId, action.quantity ?? 1);
    case 'openShop':
      return openShop(state);
    case 'nextDay':
      return nextDay(state);
  }

  // Everything below only happens while the shop is open.
  if (state.phase !== 'open') return state;
  switch (action.type) {
    case 'pause':
      return state.paused ? state : { ...state, paused: true };
    case 'resume':
      return state.paused ? { ...state, paused: false } : state;
    case 'closeShop':
      return closeShop(state);
  }

  if (state.paused) return state;
  switch (action.type) {
    case 'startBaking':
      return startBaking(state, action.recipeId);
    case 'takeOut':
      return takeOut(state);
    case 'serveCustomer':
      return serveCustomer(state, action.customerId);
  }
}

/** Moves the open-phase clock forward without any arrivals. */
function advance(state: GameState, ms: number): GameState {
  const waiting = state.customers.map((c) => ({ ...c, waitedMs: c.waitedMs + ms }));
  const staying = waiting.filter((c) => c.waitedMs < BALANCE.customerPatienceMs);
  const lost = waiting.length - staying.length;
  return {
    ...state,
    clockMs: state.clockMs + ms,
    nextCustomerInMs: state.nextCustomerInMs - ms,
    oven:
      state.oven.status === 'baking'
        ? { ...state.oven, elapsedMs: state.oven.elapsedMs + ms }
        : state.oven,
    customers: staying,
    reputation: clampReputation(state.reputation + lost * BALANCE.reputationPerLostCustomer),
    today: { ...state.today, lostCustomers: state.today.lostCustomers + lost },
  };
}

/**
 * A customer arrives, unless the queue is full and they walk past. The random
 * numbers are drawn either way, so the order of customers depends only on the
 * seed, never on how fast the player is.
 */
function customerArrives(state: GameState): GameState {
  const want = randomInt(state.rng, 0, RECIPE_IDS.length - 1);
  const gap = nextRandom(want.seed);
  const { customerIntervalMinMs: min, customerIntervalMaxMs: max } = BALANCE;
  // More stars bring customers a little faster.
  const pace = 1.3 - 0.1 * starsFor(state.reputation);
  const next = {
    ...state,
    rng: gap.seed,
    nextCustomerInMs: Math.round((min + gap.value * (max - min)) * pace),
  };
  if (state.customers.length >= BALANCE.maxWaitingCustomers) return next;
  return {
    ...next,
    nextCustomerId: state.nextCustomerId + 1,
    customers: [
      ...state.customers,
      { id: state.nextCustomerId, wants: RECIPE_IDS[want.value] as RecipeId, waitedMs: 0 },
    ],
  };
}

/** Advances game time. Only the open phase has a clock, and it stops while paused. */
export function tick(state: GameState, ms: number): GameState {
  if (state.phase !== 'open' || state.paused || !(ms > 0)) return state;
  let current = state;
  let remaining = ms;
  while (remaining > 0) {
    const untilClose = BALANCE.dayLengthMs - current.clockMs;
    const step = Math.min(remaining, untilClose, Math.max(0, current.nextCustomerInMs));
    current = advance(current, step);
    remaining -= step;
    if (current.clockMs >= BALANCE.dayLengthMs) return closeShop(current);
    if (current.nextCustomerInMs <= 0) current = customerArrives(current);
  }
  return current;
}
