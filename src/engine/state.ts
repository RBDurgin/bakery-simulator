import { BALANCE } from '../content/balance';
import { INGREDIENT_IDS, type IngredientId } from '../content/ingredients';
import { RECIPE_IDS, type RecipeId } from '../content/recipes';
import type { Cents } from './money';

export type Phase = 'morning' | 'open' | 'evening';

export type Oven =
  { status: 'empty' } | { status: 'baking'; recipeId: RecipeId; elapsedMs: number };

export interface Customer {
  id: number;
  wants: RecipeId;
  waitedMs: number;
}

/** Everything the evening report needs, counted as the day goes on. */
export interface DayStats {
  income: Cents;
  spent: Cents;
  sold: Record<RecipeId, number>;
  wasted: Record<RecipeId, number>;
  happyCustomers: number;
  lostCustomers: number;
}

export interface GameState {
  bakeryName: string;
  playerName: string;
  day: number;
  phase: Phase;
  money: Cents;
  /** Seed for the next random number. */
  rng: number;
  /** Reputation score, 0 to 100. Shown as stars. */
  reputation: number;
  ingredients: Record<IngredientId, number>;
  /** Baked goods on the shelf, ready to sell. */
  shelf: Record<RecipeId, number>;
  oven: Oven;
  customers: Customer[];
  nextCustomerId: number;
  nextCustomerInMs: number;
  /** Time since the shop opened today. */
  clockMs: number;
  paused: boolean;
  today: DayStats;
}

export interface NewGameOptions {
  seed: number;
  bakeryName?: string;
  playerName?: string;
}

export const DEFAULT_BAKERY_NAME = 'Sunny Bakery';
export const DEFAULT_PLAYER_NAME = 'Sam';

function zeroes<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}

export function emptyDayStats(): DayStats {
  return {
    income: 0,
    spent: 0,
    sold: zeroes(RECIPE_IDS),
    wasted: zeroes(RECIPE_IDS),
    happyCustomers: 0,
    lostCustomers: 0,
  };
}

/** Tidies a name the player typed: trims it, limits its length, falls back to a default. */
export function cleanName(name: string | undefined, fallback: string): string {
  const cleaned = (name ?? '').replace(/\s+/g, ' ').trim().slice(0, BALANCE.nameMaxLength).trim();
  return cleaned === '' ? fallback : cleaned;
}

export function createGame(options: NewGameOptions): GameState {
  return {
    bakeryName: cleanName(options.bakeryName, DEFAULT_BAKERY_NAME),
    playerName: cleanName(options.playerName, DEFAULT_PLAYER_NAME),
    day: 1,
    phase: 'morning',
    money: BALANCE.startingMoney,
    rng: options.seed >>> 0,
    reputation: BALANCE.startingReputation,
    ingredients: zeroes(INGREDIENT_IDS),
    shelf: zeroes(RECIPE_IDS),
    oven: { status: 'empty' },
    customers: [],
    nextCustomerId: 1,
    nextCustomerInMs: 0,
    clockMs: 0,
    paused: false,
    today: emptyDayStats(),
  };
}
