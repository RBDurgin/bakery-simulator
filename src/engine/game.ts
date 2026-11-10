import { BALANCE } from '../content/balance';
import { INGREDIENTS, INGREDIENT_IDS, type IngredientId } from '../content/ingredients';
import { PLACES, SERVING, WAKE_UP, thingById, type ThingJob } from '../content/places';
import { RECIPES, RECIPE_IDS, type RecipeId } from '../content/recipes';
import { nextRandom, randomInt } from './rng';
import { batchesPossible, ovenStage, starsFor } from './selectors';
import { emptyDayStats, type GameState, type Message, type Target } from './state';
import { msToNextSpot, walkTo } from './walk';

export type Action =
  /** Tap a thing or a customer: the baker walks there and does the job. */
  | { type: 'tap'; target: Target }
  /** Buy at the stall whose panel is open. */
  | { type: 'buyIngredient'; ingredientId: IngredientId; quantity?: number }
  /** Pick what to bake in the oven panel. */
  | { type: 'startBaking'; recipeId: RecipeId }
  | { type: 'closePanel' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'closeShop' };

function clampReputation(value: number): number {
  return Math.min(BALANCE.reputationMax, Math.max(0, value));
}

function addCount<K extends string>(counts: Record<K, number>, key: K, amount: number) {
  return { ...counts, [key]: counts[key] + amount };
}

function say(state: GameState, message: Message): GameState {
  return { ...state, message };
}

function buyIngredient(state: GameState, id: IngredientId, quantity: number): GameState {
  const atStall = state.panel?.type === 'stall' && state.panel.ingredientId === id;
  if (!atStall || !Number.isInteger(quantity) || quantity < 1) return state;
  const cost = INGREDIENTS[id].price * quantity;
  if (cost > state.money) return state;
  return {
    ...state,
    money: state.money - cost,
    ingredients: addCount(state.ingredients, id, quantity),
    today: { ...state.today, spent: state.today.spent + cost },
  };
}

function startBaking(state: GameState, recipeId: RecipeId): GameState {
  if (state.panel?.type !== 'oven' || batchesPossible(state, recipeId) < 1) return state;
  const ingredients = { ...state.ingredients };
  for (const id of INGREDIENT_IDS) {
    ingredients[id] -= RECIPES[recipeId].ingredients[id] ?? 0;
  }
  return {
    ...state,
    ingredients,
    oven: { status: 'baking', recipeId, elapsedMs: 0 },
    panel: null,
    message: { id: 'bakingStarted', recipeId },
  };
}

function closePanel(state: GameState): GameState {
  if (!state.panel) return state;
  const message: Message | null = state.panel.type === 'report' ? { id: 'goHome' } : state.message;
  return { ...state, panel: null, message };
}

function openShop(state: GameState): GameState {
  return {
    ...state,
    phase: 'open',
    clockMs: 0,
    paused: false,
    customers: [],
    nextCustomerInMs: BALANCE.firstCustomerDelayMs,
    message: { id: 'shopOpened' },
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
    panel: null,
    customers: [],
    oven: { status: 'empty' },
    shelf: emptyDayStats().sold,
    today: { ...state.today, wasted },
    tillCounted: false,
    message: { id: 'closingTime' },
  };
}

function nextDay(state: GameState): GameState {
  return {
    ...state,
    phase: 'morning',
    day: state.day + 1,
    clockMs: 0,
    today: emptyDayStats(),
    tillCounted: false,
    baker: { ...WAKE_UP, walk: null },
    message: { id: 'goodMorning' },
  };
}

/* The jobs: what happens when the baker reaches the thing that was tapped. */

function atDoor(state: GameState, door: Extract<ThingJob, { type: 'door' }>): GameState {
  if (state.baker.place === 'bakery') {
    // The baker stays in while the shop is open, and counts the till before leaving.
    if (state.phase === 'open') return say(state, { id: 'stayInShop' });
    if (state.phase === 'evening' && !state.tillCounted)
      return say(state, { id: 'countTillFirst' });
  }
  return {
    ...state,
    baker: { place: door.place, spot: door.spot, walk: null },
    message: { id: 'arrived', place: door.place },
  };
}

function atSign(state: GameState): GameState {
  if (state.phase === 'open') return say(state, { id: 'shopIsOpen' });
  if (state.phase === 'evening') return say(state, { id: 'shopClosed' });
  // With nothing to bake the sign asks first. A second tap opens the shop anyway.
  const canBake = RECIPE_IDS.some((id) => batchesPossible(state, id) > 0);
  if (!canBake && state.message?.id !== 'nothingToBake') return say(state, { id: 'nothingToBake' });
  return openShop(state);
}

function atOven(state: GameState): GameState {
  if (state.phase !== 'open') return say(state, { id: 'ovenCold' });
  if (state.oven.status === 'empty') return { ...state, panel: { type: 'oven' }, message: null };
  const { recipeId } = state.oven;
  const { batchSize } = RECIPES[recipeId];
  const stage = ovenStage(state.oven);
  if (stage === 'ready') {
    return {
      ...state,
      oven: { status: 'empty' },
      shelf: addCount(state.shelf, recipeId, batchSize),
      message: { id: 'tookOut', recipeId },
    };
  }
  if (stage === 'burnt') {
    return {
      ...state,
      oven: { status: 'empty' },
      today: { ...state.today, wasted: addCount(state.today.wasted, recipeId, batchSize) },
      message: { id: 'burnt', recipeId },
    };
  }
  return say(state, { id: 'ovenBaking', recipeId });
}

function serveCustomer(state: GameState, customerId: number): GameState {
  const customer = state.customers.find((c) => c.id === customerId);
  if (!customer) return say(state, { id: 'customerGone' });
  if (state.shelf[customer.wants] < 1)
    return say(state, { id: 'noStock', recipeId: customer.wants });
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
    message: { id: 'served', recipeId: customer.wants },
  };
}

/** At the counter: serve whoever has waited longest and can have what they want. */
function atCounter(state: GameState): GameState {
  if (state.phase !== 'open') return say(state, { id: 'counterClosed' });
  const first = state.customers[0];
  if (!first) return say(state, { id: 'nobodyWaiting' });
  const next = state.customers.find((c) => state.shelf[c.wants] > 0) ?? first;
  return serveCustomer(state, next.id);
}

function atTill(state: GameState): GameState {
  if (state.phase !== 'evening') return say(state, { id: 'tillLater' });
  return { ...state, panel: { type: 'report' }, tillCounted: true, message: null };
}

function atBed(state: GameState): GameState {
  return state.phase === 'evening' ? nextDay(state) : say(state, { id: 'notBedtime' });
}

function doJob(state: GameState, target: Target): GameState {
  if (target.kind === 'customer') return serveCustomer(state, target.id);
  const { job } = thingById(PLACES[state.baker.place], target.id)!;
  switch (job.type) {
    case 'door':
      return atDoor(state, job);
    case 'stall':
      return state.phase === 'morning'
        ? { ...state, panel: { type: 'stall', ingredientId: job.ingredientId }, message: null }
        : say(state, { id: 'stallClosed' });
    case 'oven':
      return atOven(state);
    case 'shelf':
      return say(state, { id: 'shelf' });
    case 'counter':
      return atCounter(state);
    case 'till':
      return atTill(state);
    case 'sign':
      return atSign(state);
    case 'bed':
      return atBed(state);
  }
}

/** The spot the baker must reach for a target, or null if it cannot be tapped right now. */
function targetSpot(state: GameState, target: Target): string | null {
  if (target.kind === 'thing') {
    return thingById(PLACES[state.baker.place], target.id)?.spot ?? null;
  }
  const waiting = state.customers.some((c) => c.id === target.id);
  return waiting && state.baker.place === SERVING.place ? SERVING.spot : null;
}

function tap(state: GameState, target: Target): GameState {
  if (state.panel) return state;
  const spot = targetSpot(state, target);
  const baker = spot === null ? null : walkTo(state.baker, spot, target);
  if (!baker) return state;
  // Already there: do the job straight away.
  return baker.walk ? { ...state, baker, message: null } : doJob(state, target);
}

/** The only way to change game state, apart from `tick`. Actions that are not allowed change nothing. */
export function applyAction(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'pause':
      return state.phase === 'open' && !state.paused ? { ...state, paused: true } : state;
    case 'resume':
      return state.paused ? { ...state, paused: false } : state;
    case 'closeShop':
      return state.phase === 'open' ? closeShop(state) : state;
  }

  if (state.paused) return state;
  switch (action.type) {
    case 'tap':
      return tap(state, action.target);
    case 'buyIngredient':
      return buyIngredient(state, action.ingredientId, action.quantity ?? 1);
    case 'startBaking':
      return startBaking(state, action.recipeId);
    case 'closePanel':
      return closePanel(state);
  }
}

/** Moves time forward by `ms`, with nothing arriving or finishing on the way. */
function advance(state: GameState, ms: number): GameState {
  const { walk } = state.baker;
  const walked = walk
    ? { ...state, baker: { ...state.baker, walk: { ...walk, elapsedMs: walk.elapsedMs + ms } } }
    : state;
  if (walked.phase !== 'open') return walked;

  const waiting = walked.customers.map((c) => ({ ...c, waitedMs: c.waitedMs + ms }));
  const staying = waiting.filter((c) => c.waitedMs < BALANCE.customerPatienceMs);
  const lost = waiting.length - staying.length;
  return {
    ...walked,
    clockMs: walked.clockMs + ms,
    nextCustomerInMs: walked.nextCustomerInMs - ms,
    oven:
      walked.oven.status === 'baking'
        ? { ...walked.oven, elapsedMs: walked.oven.elapsedMs + ms }
        : walked.oven,
    customers: staying,
    reputation: clampReputation(walked.reputation + lost * BALANCE.reputationPerLostCustomer),
    today: { ...walked.today, lostCustomers: walked.today.lostCustomers + lost },
  };
}

/** The baker reaches the next spot: on to the one after, or the job if this is the last. */
function reachSpot(state: GameState): GameState {
  const walk = state.baker.walk!;
  const [to, ...then] = walk.then;
  if (to !== undefined) {
    const baker = { ...state.baker, spot: walk.to, walk: { ...walk, to, elapsedMs: 0, then } };
    return { ...state, baker };
  }
  return doJob({ ...state, baker: { ...state.baker, spot: walk.to, walk: null } }, walk.goal);
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

/**
 * Advances game time. Walking takes time in every phase; the shop clock runs
 * only while the shop is open. Time stops while the game is paused or a panel
 * is open. The result is the same whether time passes in one big step or many
 * small ones.
 */
export function tick(state: GameState, ms: number): GameState {
  if (!(ms > 0)) return state;
  let current = state;
  let remaining = ms;
  while (remaining > 0 && !current.paused && !current.panel) {
    const open = current.phase === 'open';
    if (!open && !current.baker.walk) break;
    let step = Math.min(remaining, msToNextSpot(current.baker));
    if (open) {
      const untilClose = BALANCE.dayLengthMs - current.clockMs;
      step = Math.min(step, untilClose, Math.max(0, current.nextCustomerInMs));
    }
    current = advance(current, step);
    remaining -= step;

    if (current.baker.walk && msToNextSpot(current.baker) <= 0) current = reachSpot(current);
    if (current.phase !== 'open') continue;
    if (current.clockMs >= BALANCE.dayLengthMs) current = closeShop(current);
    else if (current.nextCustomerInMs <= 0) current = customerArrives(current);
  }
  return current;
}
