import { BALANCE } from '../content/balance';
import { DIFFICULTIES } from '../content/difficulty';
import { INGREDIENTS, INGREDIENT_IDS } from '../content/ingredients';
import { RECIPES, RECIPE_IDS, type RecipeId } from '../content/recipes';
import type { Cents } from './money';
import type { GameState } from './state';

export { bakerPoint } from './walk';

export type OvenStage = 'empty' | 'baking' | 'ready' | 'burnt';

/** The numbers for the game's difficulty mode. */
export function settingsFor(state: Pick<GameState, 'difficulty'>) {
  return DIFFICULTIES[state.difficulty];
}

export function ovenStage({ oven, difficulty }: Pick<GameState, 'oven' | 'difficulty'>): OvenStage {
  if (oven.status === 'empty') return 'empty';
  const { bakeMs } = RECIPES[oven.recipeId];
  if (oven.elapsedMs < bakeMs) return 'baking';
  return oven.elapsedMs < bakeMs + DIFFICULTIES[difficulty].burnWindowMs ? 'ready' : 'burnt';
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

/**
 * True when the baker can bake at least one batch of something, with what is
 * in the cupboard and what the money can still buy.
 */
export function canAffordABatch(state: Pick<GameState, 'ingredients' | 'money'>): boolean {
  return RECIPE_IDS.some((recipeId) => {
    let missing = 0;
    for (const id of INGREDIENT_IDS) {
      const needed = RECIPES[recipeId].ingredients[id] ?? 0;
      missing += Math.max(0, needed - state.ingredients[id]) * INGREDIENTS[id].price;
    }
    return missing <= state.money;
  });
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
