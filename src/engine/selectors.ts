import { BALANCE } from '../content/balance';
import { INGREDIENTS, INGREDIENT_IDS } from '../content/ingredients';
import { RECIPES, type RecipeId } from '../content/recipes';
import type { Cents } from './money';
import type { GameState, Oven } from './state';

export type OvenStage = 'empty' | 'baking' | 'ready' | 'burnt';

export function ovenStage(oven: Oven): OvenStage {
  if (oven.status === 'empty') return 'empty';
  const { bakeMs } = RECIPES[oven.recipeId];
  if (oven.elapsedMs < bakeMs) return 'baking';
  return oven.elapsedMs < bakeMs + BALANCE.burnWindowMs ? 'ready' : 'burnt';
}

/** How many batches of a recipe the current ingredients allow. */
export function batchesPossible(state: GameState, recipeId: RecipeId): number {
  let batches = Infinity;
  for (const id of INGREDIENT_IDS) {
    const needed = RECIPES[recipeId].ingredients[id] ?? 0;
    if (needed > 0) batches = Math.min(batches, Math.floor(state.ingredients[id] / needed));
  }
  return batches;
}

/** What the ingredients for one batch cost. */
export function batchCost(recipeId: RecipeId): Cents {
  let cost = 0;
  for (const id of INGREDIENT_IDS) {
    cost += (RECIPES[recipeId].ingredients[id] ?? 0) * INGREDIENTS[id].price;
  }
  return cost;
}

/** Reputation as one to five stars. */
export function starsFor(reputation: number): number {
  return Math.min(5, Math.max(1, Math.round(reputation / 20)));
}

export function profit(state: GameState): Cents {
  return state.today.income - state.today.spent;
}

/** Time left before the shop closes. */
export function timeLeftMs(state: GameState): number {
  return Math.max(0, BALANCE.dayLengthMs - state.clockMs);
}
