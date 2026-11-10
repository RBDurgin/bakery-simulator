import { describe, expect, it } from 'vitest';
import { BALANCE } from '../content/balance';
import { RECIPES } from '../content/recipes';
import { MEDIUM, newGame } from '../test/fixtures';
import { batchCost, batchesPossible, ovenStage, profit, starsFor, timeLeftMs } from './selectors';

describe('ovenStage', () => {
  const { bakeMs } = RECIPES.cookie;
  it.each([
    [0, 'baking'],
    [bakeMs - 1, 'baking'],
    [bakeMs, 'ready'],
    [bakeMs + MEDIUM.burnWindowMs - 1, 'ready'],
    [bakeMs + MEDIUM.burnWindowMs, 'burnt'],
  ])('after %i ms cookies are %s', (elapsedMs, stage) => {
    const oven = { status: 'baking', recipeId: 'cookie', elapsedMs } as const;
    expect(ovenStage(newGame({ oven }))).toBe(stage);
  });

  it('is empty for an empty oven', () => {
    expect(ovenStage(newGame())).toBe('empty');
  });
});

describe('batchesPossible', () => {
  it('is limited by the scarcest ingredient', () => {
    const game = newGame({ ingredients: { flour: 5, sugar: 3, butter: 2, egg: 0 } });
    expect(batchesPossible(game, 'cookie')).toBe(2);
    expect(batchesPossible(game, 'muffin')).toBe(0);
  });

  it('counts recipes that use two of an ingredient', () => {
    const game = newGame({ ingredients: { flour: 5, sugar: 0, butter: 0, egg: 9 } });
    expect(batchesPossible(game, 'bread')).toBe(2);
  });
});

describe('batchCost', () => {
  it('adds up the ingredient prices', () => {
    expect(batchCost('cookie')).toBe(400);
    expect(batchCost('muffin')).toBe(300);
    expect(batchCost('bread')).toBe(300);
  });

  it('every recipe earns more than its ingredients cost', () => {
    for (const recipe of Object.values(RECIPES)) {
      expect(recipe.price * recipe.batchSize).toBeGreaterThan(batchCost(recipe.id));
    }
  });
});

describe('starsFor', () => {
  it.each([
    [0, 1],
    [29, 1],
    [30, 2],
    [50, 3],
    [70, 4],
    [90, 5],
    [100, 5],
  ])('reputation %i shows %i stars', (reputation, stars) => {
    expect(starsFor(reputation)).toBe(stars);
  });
});

describe('profit and time left', () => {
  it('profit is income take away spending', () => {
    const game = newGame();
    expect(profit({ ...game, today: { ...game.today, income: 900, spent: 400 } })).toBe(500);
    expect(profit({ ...game, today: { ...game.today, income: 100, spent: 400 } })).toBe(-300);
  });

  it('time left never goes below zero', () => {
    expect(timeLeftMs(newGame({ clockMs: 1000 }))).toBe(BALANCE.dayLengthMs - 1000);
    expect(timeLeftMs(newGame({ clockMs: BALANCE.dayLengthMs + 5 }))).toBe(0);
  });
});
