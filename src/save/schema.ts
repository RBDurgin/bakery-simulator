import { isDifficulty } from '../content/difficulty';
import { INGREDIENT_IDS } from '../content/ingredients';
import { isBakerLook } from '../content/looks';
import { PLACES, type PlaceId } from '../content/places';
import { RECIPE_IDS, type RecipeId } from '../content/recipes';
import { cleanName, type DayStats, type GameState, type Message } from '../engine/state';

/** The version written into every save. Raise it with each change of format, and add a migration. */
export const SAVE_VERSION = 1;

/** What one save slot holds. */
export interface SaveFile {
  version: typeof SAVE_VERSION;
  /** The game as it was at the last autosave. */
  game: GameState;
  /** The game as it was when the baker woke up that day, for trying the day again. */
  dayStart: GameState;
}

type Raw = Record<string, unknown>;

/** Thrown inside the readers; `parseGame` turns it into null. */
class Damaged extends Error {}

function check(ok: boolean): asserts ok {
  if (!ok) throw new Damaged();
}

function record(value: unknown): Raw {
  check(typeof value === 'object' && value !== null && !Array.isArray(value));
  return value as Raw;
}

function text(value: unknown): string {
  check(typeof value === 'string');
  return value;
}

function flag(value: unknown): boolean {
  check(typeof value === 'boolean');
  return value;
}

/** A number that is not negative. Times may have fractions. */
function amount(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  check(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max);
  return value;
}

/** A whole number that is not negative: a count, or money in cents. */
function count(value: unknown, max?: number): number {
  const number = amount(value, max);
  check(Number.isInteger(number));
  return number;
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): T {
  check(options.includes(value as T));
  return value as T;
}

function counts<K extends string>(value: unknown, keys: readonly K[]): Record<K, number> {
  const raw = record(value);
  return Object.fromEntries(keys.map((key) => [key, count(raw[key])])) as Record<K, number>;
}

function dayStats(value: unknown): DayStats {
  const raw = record(value);
  return {
    income: count(raw.income),
    spent: count(raw.spent),
    sold: counts(raw.sold, RECIPE_IDS),
    wasted: counts(raw.wasted, RECIPE_IDS),
    happyCustomers: count(raw.happyCustomers),
    lostCustomers: count(raw.lostCustomers),
    repaid: count(raw.repaid),
    missedRepayment: flag(raw.missedRepayment),
  };
}

/** Messages that are only an id, with nothing else to check. */
const PLAIN_MESSAGES = [
  'goodMorning',
  'stallClosed',
  'nothingToBake',
  'shopOpened',
  'shopIsOpen',
  'shopClosed',
  'stayInShop',
  'ovenCold',
  'shelf',
  'counterClosed',
  'nobodyWaiting',
  'customerGone',
  'closingTime',
  'tillLater',
  'countTillFirst',
  'goHome',
  'notBedtime',
] as const satisfies readonly Message['id'][];

const RECIPE_MESSAGES = [
  'bakingStarted',
  'ovenBaking',
  'tookOut',
  'burnt',
  'served',
  'noStock',
] as const satisfies readonly Message['id'][];

const PLACE_IDS = Object.keys(PLACES) as PlaceId[];

function message(value: unknown): Message | null {
  if (value === null) return null;
  const raw = record(value);
  const id = text(raw.id);
  if (id === 'arrived') return { id, place: oneOf(raw.place, PLACE_IDS) };
  if (id === 'gift') return { id, amount: count(raw.amount) };
  if (id === 'loan') {
    return {
      id,
      amount: count(raw.amount),
      owed: count(raw.owed),
      repayment: count(raw.repayment),
    };
  }
  if ((RECIPE_MESSAGES as readonly string[]).includes(id)) {
    return { id: oneOf(id, RECIPE_MESSAGES), recipeId: oneOf(raw.recipeId, RECIPE_IDS) };
  }
  return { id: oneOf(id, PLAIN_MESSAGES) };
}

function oven(value: unknown): GameState['oven'] {
  const raw = record(value);
  if (raw.status === 'empty') return { status: 'empty' };
  check(raw.status === 'baking');
  return {
    status: 'baking',
    recipeId: oneOf(raw.recipeId, RECIPE_IDS),
    elapsedMs: amount(raw.elapsedMs),
  };
}

function customers(value: unknown): GameState['customers'] {
  check(Array.isArray(value));
  const list = (value as unknown[]).map((entry) => {
    const raw = record(entry);
    return {
      id: count(raw.id),
      wants: oneOf<RecipeId>(raw.wants, RECIPE_IDS),
      waitedMs: amount(raw.waitedMs),
    };
  });
  check(new Set(list.map((c) => c.id)).size === list.length);
  return list;
}

function baker(value: unknown): GameState['baker'] {
  const raw = record(value);
  const place = oneOf(raw.place, PLACE_IDS);
  const spot = oneOf(raw.spot, Object.keys(PLACES[place].spots));
  // A walk is never kept: a game that is picked up again starts standing still.
  return { place, spot, walk: null };
}

function game(value: unknown): GameState {
  const raw = record(value);
  const bakeryName = text(raw.bakeryName);
  const playerName = text(raw.playerName);
  check(bakeryName !== '' && cleanName(bakeryName, '') === bakeryName);
  check(playerName !== '' && cleanName(playerName, '') === playerName);
  check(isBakerLook(raw.bakerLook) && isDifficulty(raw.difficulty));
  check(typeof raw.nextCustomerInMs === 'number' && Number.isFinite(raw.nextCustomerInMs));
  const loan = record(raw.loan);
  return {
    bakeryName,
    playerName,
    bakerLook: raw.bakerLook,
    difficulty: raw.difficulty,
    day: count(raw.day),
    phase: oneOf(raw.phase, ['morning', 'open', 'evening'] as const),
    money: count(raw.money),
    rng: count(raw.rng, 0xffffffff),
    reputation: amount(raw.reputation, 100),
    ingredients: counts(raw.ingredients, INGREDIENT_IDS),
    shelf: counts(raw.shelf, RECIPE_IDS),
    oven: oven(raw.oven),
    customers: customers(raw.customers),
    nextCustomerId: count(raw.nextCustomerId),
    // This one may dip below zero for a moment, so only its type is checked.
    nextCustomerInMs: raw.nextCustomerInMs,
    clockMs: amount(raw.clockMs),
    // Panels and pauses are never kept either.
    paused: false,
    today: dayStats(raw.today),
    baker: baker(raw.baker),
    panel: null,
    message: message(raw.message),
    tillCounted: flag(raw.tillCounted),
    loan: { owed: count(loan.owed), missed: count(loan.missed) },
    ended: flag(raw.ended),
  };
}

/**
 * Reads a game out of saved data, checking every part. Anything unknown is
 * dropped and anything wrong gives null, so a damaged save can never reach
 * the engine.
 */
export function parseGame(value: unknown): GameState | null {
  try {
    const parsed = game(value);
    check(parsed.day >= 1);
    return parsed;
  } catch (error) {
    if (error instanceof Damaged) return null;
    throw error;
  }
}

/** Reads a whole save of the current version, or null if it is damaged. */
export function parseSave(value: unknown): SaveFile | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Raw;
  if (raw.version !== SAVE_VERSION) return null;
  const current = parseGame(raw.game);
  const dayStart = parseGame(raw.dayStart);
  return current && dayStart ? { version: SAVE_VERSION, game: current, dayStart } : null;
}
