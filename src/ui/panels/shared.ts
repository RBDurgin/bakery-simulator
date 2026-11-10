import { INGREDIENTS, INGREDIENT_IDS } from '../../content/ingredients';
import { RECIPES, type RecipeId } from '../../content/recipes';
import type { Action } from '../../engine/game';
import type { GameState } from '../../engine/state';

export interface PanelProps {
  game: GameState;
  dispatch: (action: Action) => void;
}

/** What a recipe needs, for example "1 Flour, 1 Sugar, 1 Egg". */
export function recipeNeeds(recipeId: RecipeId): string {
  const { ingredients } = RECIPES[recipeId];
  return INGREDIENT_IDS.filter((id) => ingredients[id])
    .map((id) => `${ingredients[id]} ${INGREDIENTS[id].name}`)
    .join(', ');
}
