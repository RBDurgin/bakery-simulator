import { describe, expect, it } from 'vitest';
import { BALANCE } from '../content/balance';
import { RECIPES } from '../content/recipes';
import { newGame, openGame, play } from '../test/fixtures';
import { applyAction, tick } from './game';
import { profit } from './selectors';
import type { Customer, GameState } from './state';

const customer = (id: number, wants: Customer['wants'], waitedMs = 0): Customer => ({
  id,
  wants,
  waitedMs,
});

describe('buying ingredients', () => {
  it('takes the money, adds the stock and counts the spending', () => {
    const game = play(newGame(), { type: 'buyIngredient', ingredientId: 'butter' });
    expect(game.money).toBe(BALANCE.startingMoney - 200);
    expect(game.ingredients.butter).toBe(1);
    expect(game.today.spent).toBe(200);
  });

  it('can buy several at once', () => {
    const game = play(newGame(), { type: 'buyIngredient', ingredientId: 'flour', quantity: 3 });
    expect(game.ingredients.flour).toBe(3);
    expect(game.today.spent).toBe(300);
  });

  it('refuses when there is not enough money', () => {
    const poor = newGame({ money: 199 });
    expect(play(poor, { type: 'buyIngredient', ingredientId: 'butter' })).toBe(poor);
  });

  it('allows spending the very last cent', () => {
    const game = play(newGame({ money: 200 }), { type: 'buyIngredient', ingredientId: 'butter' });
    expect(game.money).toBe(0);
  });

  it.each([0, -1, 1.5])('refuses a quantity of %d', (quantity) => {
    const game = newGame();
    expect(play(game, { type: 'buyIngredient', ingredientId: 'flour', quantity })).toBe(game);
  });

  it('is only possible in the morning', () => {
    const game = openGame();
    expect(play(game, { type: 'buyIngredient', ingredientId: 'flour' })).toBe(game);
  });
});

describe('day phases', () => {
  it('opens the shop from the morning and sets up the first customer', () => {
    const game = play(newGame(), { type: 'openShop' });
    expect(game.phase).toBe('open');
    expect(game.clockMs).toBe(0);
    expect(game.nextCustomerInMs).toBe(BALANCE.firstCustomerDelayMs);
  });

  it('ignores actions that belong to another phase', () => {
    const morning = newGame();
    for (const type of ['takeOut', 'pause', 'resume', 'closeShop', 'nextDay'] as const) {
      expect(play(morning, { type })).toBe(morning);
    }
    expect(play(morning, { type: 'startBaking', recipeId: 'cookie' })).toBe(morning);
    expect(play(morning, { type: 'serveCustomer', customerId: 1 })).toBe(morning);

    const open = openGame();
    expect(play(open, { type: 'openShop' })).toBe(open);
    expect(play(open, { type: 'nextDay' })).toBe(open);
  });

  it('closing the shop goes to the evening and wastes what is left', () => {
    const game = openGame({
      shelf: { cookie: 3, muffin: 0, bread: 1 },
      oven: { status: 'baking', recipeId: 'muffin', elapsedMs: 1000 },
      customers: [customer(1, 'bread')],
    });
    const evening = play(game, { type: 'closeShop' });
    expect(evening.phase).toBe('evening');
    expect(evening.today.wasted).toEqual({ cookie: 3, muffin: RECIPES.muffin.batchSize, bread: 1 });
    expect(evening.shelf).toEqual({ cookie: 0, muffin: 0, bread: 0 });
    expect(evening.oven).toEqual({ status: 'empty' });
    expect(evening.customers).toEqual([]);
    // Customers still waiting at closing time are not counted as lost.
    expect(evening.today.lostCustomers).toBe(0);
    expect(evening.reputation).toBe(game.reputation);
  });

  it('the next day starts a fresh morning but keeps money, ingredients and stars', () => {
    const evening: GameState = {
      ...play(openGame({ money: 1234, reputation: 61 }), { type: 'closeShop' }),
    };
    const morning = play(evening, { type: 'nextDay' });
    expect(morning).toMatchObject({ phase: 'morning', day: 2, money: 1234, reputation: 61 });
    expect(morning.ingredients).toEqual(evening.ingredients);
    expect(morning.today).toMatchObject({ income: 0, spent: 0 });
  });
});

describe('baking', () => {
  it('uses up the ingredients and fills the oven', () => {
    const game = play(openGame(), { type: 'startBaking', recipeId: 'bread' });
    expect(game.ingredients).toEqual({ flour: 8, sugar: 10, butter: 10, egg: 9 });
    expect(game.oven).toEqual({ status: 'baking', recipeId: 'bread', elapsedMs: 0 });
  });

  it('needs every ingredient', () => {
    const game = openGame({ ingredients: { flour: 1, sugar: 1, butter: 0, egg: 0 } });
    expect(play(game, { type: 'startBaking', recipeId: 'cookie' })).toBe(game);
  });

  it('only one batch fits in the oven', () => {
    const game = play(openGame(), { type: 'startBaking', recipeId: 'cookie' });
    expect(play(game, { type: 'startBaking', recipeId: 'muffin' })).toBe(game);
  });

  it('cannot take a batch out before it is ready', () => {
    const game = tick(play(openGame(), { type: 'startBaking', recipeId: 'cookie' }), 1000);
    expect(play(game, { type: 'takeOut' })).toBe(game);
  });

  it('a ready batch goes onto the shelf', () => {
    const baking = play(openGame({ nextCustomerInMs: 1e9 }), {
      type: 'startBaking',
      recipeId: 'cookie',
    });
    const game = play(tick(baking, RECIPES.cookie.bakeMs), { type: 'takeOut' });
    expect(game.shelf.cookie).toBe(RECIPES.cookie.batchSize);
    expect(game.oven).toEqual({ status: 'empty' });
    expect(game.today.wasted.cookie).toBe(0);
  });

  it('a burnt batch is wasted', () => {
    const baking = play(openGame({ nextCustomerInMs: 1e9 }), {
      type: 'startBaking',
      recipeId: 'cookie',
    });
    const burnt = tick(baking, RECIPES.cookie.bakeMs + BALANCE.burnWindowMs);
    const game = play(burnt, { type: 'takeOut' });
    expect(game.shelf.cookie).toBe(0);
    expect(game.oven).toEqual({ status: 'empty' });
    expect(game.today.wasted.cookie).toBe(RECIPES.cookie.batchSize);
  });

  it('there is nothing to take out of an empty oven', () => {
    const game = openGame();
    expect(play(game, { type: 'takeOut' })).toBe(game);
  });
});

describe('serving customers', () => {
  const waiting = () =>
    openGame({
      shelf: { cookie: 2, muffin: 0, bread: 0 },
      customers: [customer(1, 'cookie'), customer(2, 'muffin')],
    });

  it('sells one item, earns its price and makes the customer happy', () => {
    const before = waiting();
    const game = play(before, { type: 'serveCustomer', customerId: 1 });
    expect(game.money).toBe(before.money + RECIPES.cookie.price);
    expect(game.shelf.cookie).toBe(1);
    expect(game.customers.map((c) => c.id)).toEqual([2]);
    expect(game.today).toMatchObject({ income: RECIPES.cookie.price, happyCustomers: 1 });
    expect(game.today.sold.cookie).toBe(1);
    expect(game.reputation).toBe(before.reputation + BALANCE.reputationPerHappyCustomer);
  });

  it('cannot serve what is not on the shelf', () => {
    const game = waiting();
    expect(play(game, { type: 'serveCustomer', customerId: 2 })).toBe(game);
  });

  it('ignores a customer who is not there', () => {
    const game = waiting();
    expect(play(game, { type: 'serveCustomer', customerId: 99 })).toBe(game);
  });

  it('reputation never goes above the maximum', () => {
    const game = play(
      { ...waiting(), reputation: BALANCE.reputationMax },
      { type: 'serveCustomer', customerId: 1 },
    );
    expect(game.reputation).toBe(BALANCE.reputationMax);
  });
});

describe('pause', () => {
  it('stops the clock and blocks baking and serving until resumed', () => {
    const paused = play(
      openGame({ shelf: { cookie: 1, muffin: 0, bread: 0 }, customers: [customer(1, 'cookie')] }),
      { type: 'pause' },
    );
    expect(paused.paused).toBe(true);
    expect(tick(paused, 5000)).toBe(paused);
    expect(play(paused, { type: 'pause' })).toBe(paused);
    expect(play(paused, { type: 'startBaking', recipeId: 'cookie' })).toBe(paused);
    expect(play(paused, { type: 'serveCustomer', customerId: 1 })).toBe(paused);
    expect(play(paused, { type: 'takeOut' })).toBe(paused);

    const resumed = play(paused, { type: 'resume' });
    expect(resumed.paused).toBe(false);
    expect(play(resumed, { type: 'resume' })).toBe(resumed);
    expect(tick(resumed, 1000).clockMs).toBe(1000);
  });

  it('the shop can be closed from the pause screen', () => {
    const evening = play(openGame(), { type: 'pause' }, { type: 'closeShop' });
    expect(evening.phase).toBe('evening');
    expect(evening.paused).toBe(false);
  });
});

describe('tick', () => {
  it('does nothing outside the open phase or for no time', () => {
    const morning = newGame();
    expect(tick(morning, 1000)).toBe(morning);
    const open = openGame();
    expect(tick(open, 0)).toBe(open);
    expect(tick(open, -5)).toBe(open);
    expect(tick(open, Number.NaN)).toBe(open);
  });

  it('moves the clock and the oven forward', () => {
    const game = tick(play(openGame(), { type: 'startBaking', recipeId: 'bread' }), 1500);
    expect(game.clockMs).toBe(1500);
    expect(game.oven).toMatchObject({ elapsedMs: 1500 });
  });

  it('brings the first customer after the opening delay', () => {
    const before = tick(openGame(), BALANCE.firstCustomerDelayMs - 1);
    expect(before.customers).toEqual([]);
    const after = tick(before, 1);
    expect(after.customers).toHaveLength(1);
    expect(after.customers[0]).toMatchObject({ id: 1, waitedMs: 0 });
    expect(after.nextCustomerInMs).toBeGreaterThanOrEqual(BALANCE.customerIntervalMinMs);
    expect(after.nextCustomerInMs).toBeLessThanOrEqual(BALANCE.customerIntervalMaxMs);
  });

  it('gives the same day whether time passes in one step or many', () => {
    const big = tick(openGame(), 60_000);
    let small = openGame();
    for (let i = 0; i < 600; i++) small = tick(small, 100);
    expect(small).toEqual(big);
  });

  it('gives the same customers for the same seed, and different ones for another', () => {
    const wants = (seed: number) =>
      tick(openGame({ rng: seed, nextCustomerInMs: 1 }), 40_000).customers.map((c) => c.wants);
    expect(wants(42)).toEqual(wants(42));
    const orders = new Set([1, 2, 3, 4, 5, 6].map((seed) => wants(seed).join()));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('customers who wait too long leave, and that costs reputation', () => {
    const game = tick(
      openGame({
        nextCustomerInMs: 1e9,
        customers: [
          customer(1, 'cookie', BALANCE.customerPatienceMs - 1000),
          customer(2, 'bread', 0),
        ],
      }),
      1000,
    );
    expect(game.customers.map((c) => c.id)).toEqual([2]);
    expect(game.today.lostCustomers).toBe(1);
    expect(game.reputation).toBe(BALANCE.startingReputation + BALANCE.reputationPerLostCustomer);
  });

  it('reputation never drops below zero', () => {
    const game = tick(
      openGame({
        reputation: 1,
        nextCustomerInMs: 1e9,
        customers: [customer(1, 'cookie', BALANCE.customerPatienceMs)],
      }),
      1,
    );
    expect(game.reputation).toBe(0);
  });

  it('customers walk past when the queue is full', () => {
    const full = openGame({
      nextCustomerInMs: 1,
      nextCustomerId: 5,
      customers: [1, 2, 3, 4].map((id) => customer(id, 'cookie')),
    });
    const game = tick(full, 1);
    expect(game.customers).toHaveLength(BALANCE.maxWaitingCustomers);
    expect(game.nextCustomerId).toBe(5);
    expect(game.nextCustomerInMs).toBeGreaterThan(0);
    expect(game.rng).not.toBe(full.rng);
  });

  it('more stars bring customers sooner', () => {
    const gap = (reputation: number) =>
      tick(openGame({ reputation, nextCustomerInMs: 1 }), 1).nextCustomerInMs;
    expect(gap(100)).toBeLessThan(gap(50));
    expect(gap(50)).toBeLessThan(gap(0));
  });

  it('closes the shop when the day is over', () => {
    const game = tick(openGame({ shelf: { cookie: 2, muffin: 0, bread: 0 } }), 10 * 60_000);
    expect(game.phase).toBe('evening');
    expect(game.clockMs).toBe(BALANCE.dayLengthMs);
    expect(game.today.wasted.cookie).toBe(2);
    expect(game.today.lostCustomers).toBeGreaterThan(0);
  });
});

describe('a whole day', () => {
  it('adds up to the right profit', () => {
    let game = play(
      newGame(),
      { type: 'buyIngredient', ingredientId: 'flour' },
      { type: 'buyIngredient', ingredientId: 'sugar' },
      { type: 'buyIngredient', ingredientId: 'butter' },
      { type: 'openShop' },
      { type: 'startBaking', recipeId: 'cookie' },
    );
    game = play(tick(game, RECIPES.cookie.bakeMs), { type: 'takeOut' });
    expect(game.shelf.cookie).toBe(6);

    // Serve every cookie customer who turns up for the rest of the day.
    while (game.phase === 'open') {
      game = tick(game, 500);
      for (const c of game.customers) {
        if (c.wants === 'cookie')
          game = applyAction(game, { type: 'serveCustomer', customerId: c.id });
      }
    }

    const sold = game.today.sold.cookie;
    expect(sold).toBeGreaterThan(0);
    expect(game.today.income).toBe(sold * RECIPES.cookie.price);
    expect(game.today.spent).toBe(400);
    expect(game.today.wasted.cookie).toBe(6 - sold);
    expect(profit(game)).toBe(sold * 150 - 400);
    expect(game.money).toBe(BALANCE.startingMoney + profit(game));
  });

  it('seed 42 sends the customers the Playwright journey expects', () => {
    const game = tick(openGame({ rng: 42 }), 40_000);
    expect(game.customers.map((c) => c.wants)).toMatchInlineSnapshot(`
      [
        "muffin",
        "bread",
        "cookie",
        "cookie",
      ]
    `);
  });
});
