import type { AssetId } from '../assets';
import type { Cents } from '../engine/money';
import type { IngredientId } from './ingredients';

export type RecipeId = 'cookie' | 'muffin' | 'bread';

export interface Recipe {
  id: RecipeId;
  /** Name of one item, for example "Cookie". */
  name: string;
  /** Name of several items, for example "Cookies". */
  plural: string;
  asset: AssetId;
  /** Units of each ingredient used by one batch. */
  ingredients: Partial<Record<IngredientId, number>>;
  /** How many items one batch makes. */
  batchSize: number;
  /** Oven time for one batch, in game milliseconds. */
  bakeMs: number;
  /** Selling price of one item, in cents. */
  price: Cents;
}

export const RECIPES: Record<RecipeId, Recipe> = {
  cookie: {
    id: 'cookie',
    name: 'Cookie',
    plural: 'Cookies',
    asset: 'cookie',
    ingredients: { flour: 1, sugar: 1, butter: 1 },
    batchSize: 6,
    bakeMs: 10_000,
    price: 150,
  },
  muffin: {
    id: 'muffin',
    name: 'Muffin',
    plural: 'Muffins',
    asset: 'muffin',
    ingredients: { flour: 1, sugar: 1, egg: 1 },
    batchSize: 4,
    bakeMs: 15_000,
    price: 200,
  },
  bread: {
    id: 'bread',
    name: 'Bread',
    plural: 'Bread',
    asset: 'bread',
    ingredients: { flour: 2, egg: 1 },
    batchSize: 2,
    bakeMs: 20_000,
    price: 400,
  },
};

export const RECIPE_IDS = Object.keys(RECIPES) as RecipeId[];
