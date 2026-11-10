import { BALANCE } from '../content/balance';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  isDifficulty,
  type Difficulty,
} from '../content/difficulty';
import { INGREDIENT_IDS, type IngredientId } from '../content/ingredients';
import { DEFAULT_BAKER_LOOK, isBakerLook, type BakerLook } from '../content/looks';
import { WAKE_UP, type PlaceId } from '../content/places';
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
  /** Paid back on a loan when the till was counted. Not part of the profit. */
  repaid: Cents;
  /** True when a repayment was due this evening and there was not enough money. */
  missedRepayment: boolean;
}

/** Money lent by the bank when the baker ran out. Easy mode never has one. */
export interface Loan {
  owed: Cents;
  /** Repayments missed since the loan was last fully paid back. */
  missed: number;
}

/** What the player tapped: a thing in the baker's place, or a waiting customer. */
export type Target = { kind: 'thing'; id: string } | { kind: 'customer'; id: number };

/** A walk in progress, from the baker's spot towards the next one. */
export interface Walk {
  /** The spot the baker is walking to right now. */
  to: string;
  /** Time spent on the way from the baker's spot to `to`. */
  elapsedMs: number;
  /** The spots to pass after `to`, ending where the job is. */
  then: string[];
  /** What the baker will do on arriving. */
  goal: Target;
}

export interface Baker {
  place: PlaceId;
  /** The spot the baker stands on, or the one just left while walking. */
  spot: string;
  walk: Walk | null;
}

/** A menu panel, open at the place where its job is done. The clock stops while one is open. */
export type Panel =
  { type: 'stall'; ingredientId: IngredientId } | { type: 'oven' } | { type: 'report' };

/** What just happened, for the UI to put into words. */
export type Message =
  | { id: 'goodMorning' }
  | { id: 'gift'; amount: Cents }
  | { id: 'loan'; amount: Cents; owed: Cents; repayment: Cents }
  | { id: 'arrived'; place: PlaceId }
  | { id: 'stallClosed' }
  | { id: 'nothingToBake' }
  | { id: 'shopOpened' }
  | { id: 'shopIsOpen' }
  | { id: 'shopClosed' }
  | { id: 'stayInShop' }
  | { id: 'ovenCold' }
  | { id: 'bakingStarted'; recipeId: RecipeId }
  | { id: 'ovenBaking'; recipeId: RecipeId }
  | { id: 'tookOut'; recipeId: RecipeId }
  | { id: 'burnt'; recipeId: RecipeId }
  | { id: 'shelf' }
  | { id: 'counterClosed' }
  | { id: 'nobodyWaiting' }
  | { id: 'served'; recipeId: RecipeId }
  | { id: 'noStock'; recipeId: RecipeId }
  | { id: 'customerGone' }
  | { id: 'closingTime' }
  | { id: 'tillLater' }
  | { id: 'countTillFirst' }
  | { id: 'goHome' }
  | { id: 'notBedtime' };

export interface GameState {
  bakeryName: string;
  playerName: string;
  bakerLook: BakerLook;
  difficulty: Difficulty;
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
  /** Where the baker is, and any walk in progress. */
  baker: Baker;
  panel: Panel | null;
  message: Message | null;
  /** True once the till has been counted this evening. */
  tillCounted: boolean;
  loan: Loan;
  /** True when the run is over (Hard only). Nothing changes after that. */
  ended: boolean;
}

export interface NewGameOptions {
  seed: number;
  bakeryName?: string;
  playerName?: string;
  bakerLook?: string;
  difficulty?: string;
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
    repaid: 0,
    missedRepayment: false,
  };
}

/** Tidies a name the player typed: trims it, limits its length, falls back to a default. */
export function cleanName(name: string | undefined, fallback: string): string {
  const cleaned = (name ?? '').replace(/\s+/g, ' ').trim().slice(0, BALANCE.nameMaxLength).trim();
  return cleaned === '' ? fallback : cleaned;
}

export function createGame(options: NewGameOptions): GameState {
  const difficulty = isDifficulty(options.difficulty) ? options.difficulty : DEFAULT_DIFFICULTY;
  return {
    bakeryName: cleanName(options.bakeryName, DEFAULT_BAKERY_NAME),
    playerName: cleanName(options.playerName, DEFAULT_PLAYER_NAME),
    bakerLook: isBakerLook(options.bakerLook) ? options.bakerLook : DEFAULT_BAKER_LOOK,
    difficulty,
    day: 1,
    phase: 'morning',
    money: DIFFICULTIES[difficulty].startingMoney,
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
    baker: { ...WAKE_UP, walk: null },
    panel: null,
    message: { id: 'goodMorning' },
    tillCounted: false,
    loan: { owed: 0, missed: 0 },
    ended: false,
  };
}
