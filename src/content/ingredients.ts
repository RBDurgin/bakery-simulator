import type { AssetId } from '../assets';
import type { Cents } from '../engine/money';

export type IngredientId = 'flour' | 'sugar' | 'butter' | 'egg';

export interface Ingredient {
  id: IngredientId;
  name: string;
  asset: AssetId;
  /** Price of one unit, in cents. */
  price: Cents;
}

export const INGREDIENTS: Record<IngredientId, Ingredient> = {
  flour: { id: 'flour', name: 'Flour', asset: 'flour', price: 100 },
  sugar: { id: 'sugar', name: 'Sugar', asset: 'sugar', price: 100 },
  butter: { id: 'butter', name: 'Butter', asset: 'butter', price: 200 },
  egg: { id: 'egg', name: 'Egg', asset: 'egg', price: 100 },
};

export const INGREDIENT_IDS = Object.keys(INGREDIENTS) as IngredientId[];
