import { describe, expect, it } from 'vitest';
import { BALANCE } from '../content/balance';
import { RECIPES } from '../content/recipes';
import {
  arrive,
  at,
  customer,
  eveningGame,
  goTo,
  newGame,
  openGame,
  play,
  stallGame,
  tapCustomer,
  tapThing,
} from '../test/fixtures';
import { tick } from './game';
import { profit } from './selectors';
import type { GameState } from './state';

const bake = (state: GameState, recipeId: keyof typeof RECIPES) =>
  play(goTo(state, 'oven'), { type: 'startBaking', recipeId });

describe('tapping to walk', () => {
  it('sends the baker walking and clears the old message', () => {
    const game = tapThing(openGame({ message: { id: 'shelf' } }), 'till');
    expect(game.baker.walk).toMatchObject({ to: 'counter', goal: { kind: 'thing', id: 'till' } });
    expect(game.message).toBeNull();
  });

  it('does the job on arriving, not before', () => {
    const walking = tapThing(openGame({ ...at('bakery', 'till') }), 'shelf');
    expect(walking.message).toBeNull();
    expect(arrive(walking).message).toEqual({ id: 'shelf' });
  });

  it('does the job straight away when the baker is already there', () => {
    const game = tapThing(openGame(), 'shelf');
    expect(game.baker.walk).toBeNull();
    expect(game.message).toEqual({ id: 'shelf' });
  });

  it('tapping somewhere else changes the plan', () => {
    const toTill = tick(tapThing(openGame({ ...at('bakery', 'oven') }), 'till'), 100);
    const toOven = arrive(tapThing(toTill, 'oven'));
    expect(toOven.baker).toEqual({ place: 'bakery', spot: 'oven', walk: null });
    // The oven job was done, the till job was not.
    expect(toOven.panel).toEqual({ type: 'oven' });
  });

  it('ignores things that are not in this place', () => {
    const game = newGame();
    expect(tapThing(game, 'oven')).toBe(game);
    expect(tapThing(game, 'nothing')).toBe(game);
  });

  it('ignores taps while a panel is open', () => {
    const game = stallGame('flour');
    expect(tapThing(game, 'sugar')).toBe(game);
  });

  it('walks in the morning and evening too, when the shop clock is stopped', () => {
    const morning = goTo(newGame(), 'door');
    expect(morning.baker).toEqual({ place: 'street', spot: 'home', walk: null });
    expect(morning.clockMs).toBe(0);
  });
});

describe('doors', () => {
  it('lead to the next place and say where the baker is', () => {
    let game = goTo(newGame(), 'door');
    expect(game.message).toEqual({ id: 'arrived', place: 'street' });
    game = goTo(game, 'market');
    expect(game.baker).toEqual({ place: 'market', spot: 'exit', walk: null });
    game = goTo(goTo(game, 'exit'), 'bakery');
    expect(game.baker).toEqual({ place: 'bakery', spot: 'door', walk: null });
    expect(game.message).toEqual({ id: 'arrived', place: 'bakery' });
  });

  it('keep the baker in the bakery while the shop is open', () => {
    const game = goTo(openGame(), 'door');
    expect(game.baker.place).toBe('bakery');
    expect(game.message).toEqual({ id: 'stayInShop' });
  });

  it('keep the baker in the bakery until the till is counted', () => {
    const stuck = goTo(eveningGame(), 'door');
    expect(stuck.baker.place).toBe('bakery');
    expect(stuck.message).toEqual({ id: 'countTillFirst' });

    const free = goTo(eveningGame({ tillCounted: true }), 'door');
    expect(free.baker.place).toBe('street');
  });
});

describe('buying ingredients', () => {
  const buy = (ingredientId: 'flour' | 'butter', quantity?: number) =>
    ({ type: 'buyIngredient', ingredientId, quantity }) as const;

  it('a stall opens its panel in the morning', () => {
    const game = goTo(newGame(at('market', 'exit')), 'butter');
    expect(game.panel).toEqual({ type: 'stall', ingredientId: 'butter' });
    expect(game.baker.spot).toBe('butter');
  });

  it('a stall is closed for the rest of the day', () => {
    const game = goTo(eveningGame({ ...at('market', 'exit'), tillCounted: true }), 'butter');
    expect(game.panel).toBeNull();
    expect(game.message).toEqual({ id: 'stallClosed' });
  });

  it('takes the money, adds the stock and counts the spending', () => {
    const game = play(stallGame('butter'), buy('butter'));
    expect(game.money).toBe(BALANCE.startingMoney - 200);
    expect(game.ingredients.butter).toBe(1);
    expect(game.today.spent).toBe(200);
  });

  it('can buy several at once', () => {
    const game = play(stallGame('flour'), buy('flour', 3));
    expect(game.ingredients.flour).toBe(3);
    expect(game.today.spent).toBe(300);
  });

  it('refuses when there is not enough money', () => {
    const poor = stallGame('butter', { money: 199 });
    expect(play(poor, buy('butter'))).toBe(poor);
  });

  it('allows spending the very last cent', () => {
    expect(play(stallGame('butter', { money: 200 }), buy('butter')).money).toBe(0);
  });

  it.each([0, -1, 1.5])('refuses a quantity of %d', (quantity) => {
    const game = stallGame('flour');
    expect(play(game, buy('flour', quantity))).toBe(game);
  });

  it('is only possible at the stall that sells it', () => {
    const away = newGame(at('market', 'flour'));
    expect(play(away, buy('flour'))).toBe(away);
    const wrongStall = stallGame('butter');
    expect(play(wrongStall, buy('flour'))).toBe(wrongStall);
  });

  it('closing the panel keeps the baker at the stall', () => {
    const game = play(stallGame('flour'), { type: 'closePanel' });
    expect(game.panel).toBeNull();
    expect(game.baker.spot).toBe('flour');
    expect(play(game, { type: 'closePanel' })).toBe(game);
  });
});

describe('the sign', () => {
  const stocked = { ingredients: { flour: 1, sugar: 1, butter: 1, egg: 0 } };

  it('opens the shop and sets up the first customer', () => {
    const game = tapThing(newGame({ ...at('bakery', 'door'), ...stocked }), 'sign');
    expect(game.phase).toBe('open');
    expect(game.clockMs).toBe(0);
    expect(game.nextCustomerInMs).toBe(BALANCE.firstCustomerDelayMs);
    expect(game.message).toEqual({ id: 'shopOpened' });
  });

  it('asks first when there is nothing to bake, then opens anyway', () => {
    const asked = tapThing(newGame(at('bakery', 'door')), 'sign');
    expect(asked.phase).toBe('morning');
    expect(asked.message).toEqual({ id: 'nothingToBake' });
    expect(tapThing(asked, 'sign').phase).toBe('open');
  });

  it('asks again after the baker has walked away', () => {
    const asked = tapThing(newGame(at('bakery', 'door')), 'sign');
    const back = goTo(goTo(asked, 'shelf'), 'sign');
    expect(back.phase).toBe('morning');
    expect(back.message).toEqual({ id: 'nothingToBake' });
  });

  it('only tells the time of day once the shop has opened', () => {
    expect(goTo(openGame(), 'sign')).toMatchObject({
      phase: 'open',
      message: { id: 'shopIsOpen' },
    });
    expect(goTo(eveningGame(), 'sign')).toMatchObject({
      phase: 'evening',
      message: { id: 'shopClosed' },
    });
  });
});

describe('the oven', () => {
  it('is cold until the shop opens', () => {
    const game = goTo(newGame(at('bakery', 'door')), 'oven');
    expect(game.panel).toBeNull();
    expect(game.message).toEqual({ id: 'ovenCold' });
    expect(play(game, { type: 'startBaking', recipeId: 'cookie' })).toBe(game);
  });

  it('offers what to bake when it is empty', () => {
    expect(goTo(openGame(), 'oven').panel).toEqual({ type: 'oven' });
  });

  it('baking uses up the ingredients, fills the oven and closes the panel', () => {
    const game = bake(openGame(), 'bread');
    expect(game.ingredients).toEqual({ flour: 8, sugar: 10, butter: 10, egg: 9 });
    expect(game.oven).toEqual({ status: 'baking', recipeId: 'bread', elapsedMs: 0 });
    expect(game.panel).toBeNull();
    expect(game.message).toEqual({ id: 'bakingStarted', recipeId: 'bread' });
  });

  it('baking needs every ingredient', () => {
    const game = goTo(openGame({ ingredients: { flour: 1, sugar: 1, butter: 0, egg: 0 } }), 'oven');
    expect(play(game, { type: 'startBaking', recipeId: 'cookie' })).toBe(game);
  });

  it('baking needs the baker at the oven', () => {
    const game = openGame();
    expect(play(game, { type: 'startBaking', recipeId: 'cookie' })).toBe(game);
  });

  it('says what is baking, and leaves it in, before it is ready', () => {
    const baking = tick(bake(openGame(), 'cookie'), 1000);
    const game = tapThing(baking, 'oven');
    expect(game.oven).toEqual(baking.oven);
    expect(game.panel).toBeNull();
    expect(game.message).toEqual({ id: 'ovenBaking', recipeId: 'cookie' });
  });

  it('a ready batch goes onto the shelf', () => {
    const game = tapThing(tick(bake(openGame(), 'cookie'), RECIPES.cookie.bakeMs), 'oven');
    expect(game.shelf.cookie).toBe(RECIPES.cookie.batchSize);
    expect(game.oven).toEqual({ status: 'empty' });
    expect(game.today.wasted.cookie).toBe(0);
    expect(game.message).toEqual({ id: 'tookOut', recipeId: 'cookie' });
  });

  it('a burnt batch is wasted', () => {
    const burnt = tick(bake(openGame(), 'cookie'), RECIPES.cookie.bakeMs + BALANCE.burnWindowMs);
    const game = tapThing(burnt, 'oven');
    expect(game.shelf.cookie).toBe(0);
    expect(game.oven).toEqual({ status: 'empty' });
    expect(game.today.wasted.cookie).toBe(RECIPES.cookie.batchSize);
    expect(game.message).toEqual({ id: 'burnt', recipeId: 'cookie' });
  });

  it('the clock stops while the baker picks what to bake', () => {
    const picking = goTo(openGame(), 'oven');
    expect(tick(picking, 5000)).toBe(picking);
    const closed = play(picking, { type: 'closePanel' });
    expect(tick(closed, 1000).clockMs).toBe(picking.clockMs + 1000);
  });

  it('walking to the oven is time away from the counter', () => {
    const game = goTo(openGame({ ...at('bakery', 'till') }), 'oven');
    expect(game.clockMs).toBeGreaterThan(1000);
  });
});

describe('serving customers', () => {
  const waiting = (overrides: Partial<GameState> = {}) =>
    openGame({
      ...at('bakery', 'counter'),
      shelf: { cookie: 2, muffin: 0, bread: 0 },
      customers: [customer(1, 'muffin'), customer(2, 'cookie')],
      ...overrides,
    });

  it('sells one item, earns its price and makes the customer happy', () => {
    const before = waiting();
    const game = tapCustomer(before, 2);
    expect(game.money).toBe(before.money + RECIPES.cookie.price);
    expect(game.shelf.cookie).toBe(1);
    expect(game.customers.map((c) => c.id)).toEqual([1]);
    expect(game.today).toMatchObject({ income: RECIPES.cookie.price, happyCustomers: 1 });
    expect(game.today.sold.cookie).toBe(1);
    expect(game.reputation).toBe(before.reputation + BALANCE.reputationPerHappyCustomer);
    expect(game.message).toEqual({ id: 'served', recipeId: 'cookie' });
  });

  it('the baker walks to the counter first', () => {
    const walking = tapCustomer(waiting(at('bakery', 'oven')), 2);
    expect(walking.customers).toHaveLength(2);
    const game = arrive(walking);
    expect(game.baker.spot).toBe('counter');
    expect(game.customers.map((c) => c.id)).toEqual([1]);
  });

  it('cannot serve what is not on the shelf', () => {
    const game = tapCustomer(waiting(), 1);
    expect(game.customers).toHaveLength(2);
    expect(game.money).toBe(BALANCE.startingMoney);
    expect(game.message).toEqual({ id: 'noStock', recipeId: 'muffin' });
  });

  it('ignores a customer who is not there', () => {
    const game = waiting();
    expect(tapCustomer(game, 99)).toBe(game);
  });

  it('is kind when the customer leaves while the baker is on the way', () => {
    const before = waiting({
      ...at('bakery', 'oven'),
      customers: [customer(1, 'cookie', BALANCE.customerPatienceMs - 100)],
    });
    const game = arrive(tapCustomer(before, 1));
    expect(game.customers).toEqual([]);
    expect(game.today.lostCustomers).toBe(1);
    expect(game.message).toEqual({ id: 'customerGone' });
  });

  it('the counter serves the customer who has waited longest and can be served', () => {
    const game = tapThing(waiting(), 'counter');
    expect(game.customers.map((c) => c.id)).toEqual([1]);
    expect(game.message).toEqual({ id: 'served', recipeId: 'cookie' });
  });

  it('the counter says what is missing when nobody can be served', () => {
    const game = tapThing(waiting({ shelf: { cookie: 0, muffin: 0, bread: 0 } }), 'counter');
    expect(game.customers).toHaveLength(2);
    expect(game.message).toEqual({ id: 'noStock', recipeId: 'muffin' });
  });

  it('the counter says when nobody is waiting, or the shop is shut', () => {
    expect(tapThing(waiting({ customers: [] }), 'counter').message).toEqual({
      id: 'nobodyWaiting',
    });
    expect(goTo(eveningGame(), 'counter').message).toEqual({ id: 'counterClosed' });
  });

  it('reputation never goes above the maximum', () => {
    const game = tapCustomer(waiting({ reputation: BALANCE.reputationMax }), 2);
    expect(game.reputation).toBe(BALANCE.reputationMax);
  });
});

describe('pause', () => {
  it('stops the clock and the baker until resumed', () => {
    const walking = tapThing(openGame(), 'till');
    const paused = play(walking, { type: 'pause' });
    expect(paused.paused).toBe(true);
    expect(tick(paused, 5000)).toBe(paused);
    expect(play(paused, { type: 'pause' })).toBe(paused);
    expect(tapThing(paused, 'oven')).toBe(paused);
    expect(play(paused, { type: 'closePanel' })).toBe(paused);

    const resumed = play(paused, { type: 'resume' });
    expect(resumed.paused).toBe(false);
    expect(play(resumed, { type: 'resume' })).toBe(resumed);
    expect(tick(resumed, 1000).clockMs).toBe(1000);
  });

  it('is only for the open shop', () => {
    const morning = newGame();
    expect(play(morning, { type: 'pause' })).toBe(morning);
    expect(play(morning, { type: 'resume' })).toBe(morning);
    expect(play(morning, { type: 'closeShop' })).toBe(morning);
  });

  it('the shop can be closed from the pause screen', () => {
    const evening = play(openGame(), { type: 'pause' }, { type: 'closeShop' });
    expect(evening.phase).toBe('evening');
    expect(evening.paused).toBe(false);
  });
});

describe('closing and the evening', () => {
  it('closing the shop goes to the evening and wastes what is left', () => {
    const game = openGame({
      shelf: { cookie: 3, muffin: 0, bread: 1 },
      oven: { status: 'baking', recipeId: 'muffin', elapsedMs: 1000 },
      customers: [customer(1, 'bread')],
      panel: { type: 'oven' },
    });
    const evening = play(game, { type: 'closeShop' });
    expect(evening.phase).toBe('evening');
    expect(evening.today.wasted).toEqual({ cookie: 3, muffin: RECIPES.muffin.batchSize, bread: 1 });
    expect(evening.shelf).toEqual({ cookie: 0, muffin: 0, bread: 0 });
    expect(evening.oven).toEqual({ status: 'empty' });
    expect(evening.customers).toEqual([]);
    expect(evening.panel).toBeNull();
    expect(evening.message).toEqual({ id: 'closingTime' });
    // Customers still waiting at closing time are not counted as lost.
    expect(evening.today.lostCustomers).toBe(0);
    expect(evening.reputation).toBe(game.reputation);
  });

  it('the till is for the evening', () => {
    expect(goTo(openGame(), 'till')).toMatchObject({ panel: null, message: { id: 'tillLater' } });
  });

  it('counting the till opens the report, and closing it sends the baker home', () => {
    const counted = goTo(eveningGame(), 'till');
    expect(counted.panel).toEqual({ type: 'report' });
    expect(counted.tillCounted).toBe(true);
    const done = play(counted, { type: 'closePanel' });
    expect(done.panel).toBeNull();
    expect(done.message).toEqual({ id: 'goHome' });
  });

  it('the bed is for the evening', () => {
    const game = tapThing(newGame(), 'bed');
    expect(game).toMatchObject({ phase: 'morning', day: 1, message: { id: 'notBedtime' } });
  });

  it('going to bed starts a fresh morning but keeps money, ingredients and stars', () => {
    const evening = eveningGame({
      ...at('home', 'door'),
      money: 1234,
      reputation: 61,
      tillCounted: true,
      ingredients: { flour: 2, sugar: 0, butter: 1, egg: 0 },
      today: { ...newGame().today, income: 900, spent: 400 },
    });
    const morning = goTo(evening, 'bed');
    expect(morning).toMatchObject({ phase: 'morning', day: 2, money: 1234, reputation: 61 });
    expect(morning.ingredients).toEqual(evening.ingredients);
    expect(morning.today).toMatchObject({ income: 0, spent: 0 });
    expect(morning.tillCounted).toBe(false);
    expect(morning.baker).toEqual({ place: 'home', spot: 'bed', walk: null });
    expect(morning.message).toEqual({ id: 'goodMorning' });
  });
});

describe('tick', () => {
  it('does nothing when nothing is moving, or for no time', () => {
    const morning = newGame();
    expect(tick(morning, 1000)).toBe(morning);
    const open = openGame();
    expect(tick(open, 0)).toBe(open);
    expect(tick(open, -5)).toBe(open);
    expect(tick(open, Number.NaN)).toBe(open);
  });

  it('moves the clock and the oven forward', () => {
    const game = tick(bake(openGame(), 'bread'), 1500);
    expect(game.oven).toMatchObject({ elapsedMs: 1500 });
  });

  it('brings the first customer after the opening delay', () => {
    const opened = tapThing(newGame(at('bakery', 'door')), 'sign');
    const before = tick(tapThing(opened, 'sign'), BALANCE.firstCustomerDelayMs - 1);
    expect(before.customers).toEqual([]);
    const after = tick(before, 1);
    expect(after.customers).toHaveLength(1);
    expect(after.customers[0]).toMatchObject({ id: 1, waitedMs: 0 });
    expect(after.nextCustomerInMs).toBeGreaterThanOrEqual(BALANCE.customerIntervalMinMs);
    expect(after.nextCustomerInMs).toBeLessThanOrEqual(BALANCE.customerIntervalMaxMs);
  });

  it('gives the same day whether time passes in one step or many', () => {
    const start = tapThing(openGame({ nextCustomerInMs: 1 }), 'till');
    const big = tick(start, 60_000);
    let small = start;
    for (let i = 0; i < 600; i++) small = tick(small, 100);
    expect(small).toEqual(big);
  });

  it('gives the same result when a walk ends in a panel part of the way through a tick', () => {
    const start = tapThing(openGame({ ...at('bakery', 'till'), nextCustomerInMs: 1 }), 'oven');
    const big = tick(start, 30_000);
    let small = start;
    for (let i = 0; i < 3000; i++) small = tick(small, 10);
    expect(big.panel).toEqual({ type: 'oven' });
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
      openGame({ reputation: 1, customers: [customer(1, 'cookie', BALANCE.customerPatienceMs)] }),
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
    const game = tick(
      openGame({ shelf: { cookie: 2, muffin: 0, bread: 0 }, nextCustomerInMs: 1 }),
      10 * 60_000,
    );
    expect(game.phase).toBe('evening');
    expect(game.clockMs).toBe(BALANCE.dayLengthMs);
    expect(game.today.wasted.cookie).toBe(2);
    expect(game.today.lostCustomers).toBeGreaterThan(0);
  });

  it('a baker who is walking at closing time finishes the walk', () => {
    const walking = tapThing(
      openGame({ ...at('bakery', 'oven'), clockMs: BALANCE.dayLengthMs - 100 }),
      'till',
    );
    const game = tick(walking, 10_000);
    expect(game.phase).toBe('evening');
    expect(game.clockMs).toBe(BALANCE.dayLengthMs);
    expect(game.baker).toEqual({ place: 'bakery', spot: 'till', walk: null });
    // The job was done in the evening, so the till was counted.
    expect(game.panel).toEqual({ type: 'report' });
  });
});

describe('a whole day', () => {
  it('adds up to the right profit, from waking up to going back to bed', () => {
    const buy = (state: GameState, ingredientId: 'flour' | 'sugar' | 'butter') =>
      play(
        goTo(state, ingredientId),
        { type: 'buyIngredient', ingredientId },
        { type: 'closePanel' },
      );

    // Morning: out of the house, to the market, then to the bakery.
    let game = goTo(goTo(newGame({ rng: 42 }), 'door'), 'market');
    game = buy(buy(buy(game, 'flour'), 'sugar'), 'butter');
    game = goTo(goTo(goTo(game, 'exit'), 'bakery'), 'sign');
    expect(game.phase).toBe('open');

    game = bake(game, 'cookie');
    while (game.oven.status === 'baking' && game.oven.elapsedMs < RECIPES.cookie.bakeMs) {
      game = tick(game, 100);
    }
    game = goTo(game, 'oven');
    expect(game.shelf.cookie).toBe(6);

    // Serve every cookie customer who turns up for the rest of the day.
    while (game.phase === 'open') {
      game = tick(game, 500);
      const wantsCookie = game.customers.find((c) => c.wants === 'cookie');
      if (wantsCookie && !game.baker.walk) game = tapCustomer(game, wantsCookie.id);
    }

    const sold = game.today.sold.cookie;
    expect(sold).toBeGreaterThan(0);
    expect(game.today.income).toBe(sold * RECIPES.cookie.price);
    expect(game.today.spent).toBe(400);
    expect(game.today.wasted.cookie).toBe(6 - sold);
    expect(profit(game)).toBe(sold * 150 - 400);
    expect(game.money).toBe(BALANCE.startingMoney + profit(game));

    // Evening: count the till, walk home, go to bed.
    game = play(goTo(game, 'till'), { type: 'closePanel' });
    game = goTo(goTo(goTo(game, 'door'), 'home'), 'bed');
    expect(game).toMatchObject({ phase: 'morning', day: 2 });
    expect(game.money).toBe(BALANCE.startingMoney + sold * 150 - 400);
  });

  it('seed 42 sends the customers the Playwright journey expects', () => {
    const game = tick(
      openGame({ rng: 42, nextCustomerInMs: BALANCE.firstCustomerDelayMs }),
      40_000,
    );
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
