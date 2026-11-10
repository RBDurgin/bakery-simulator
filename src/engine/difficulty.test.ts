import { describe, expect, it } from 'vitest';
import { BALANCE } from '../content/balance';
import { DIFFICULTIES, DIFFICULTY_IDS, isDifficulty, type Difficulty } from '../content/difficulty';
import { RECIPES } from '../content/recipes';
import { at, customer, eveningGame, goTo, newGame, openGame, tapThing } from '../test/fixtures';
import { applyAction, resumeGame, tick } from './game';
import { canAffordABatch, ovenStage } from './selectors';
import { createGame, type GameState } from './state';

const { easy, medium, hard } = DIFFICULTIES;
const on = (difficulty: Difficulty) => ({ difficulty });
const noIngredients = { flour: 0, sugar: 0, butter: 0, egg: 0 };

/** The evening of a day with nothing in the cupboard, ready for bed. */
const broke = (difficulty: Difficulty, overrides: Partial<GameState> = {}) =>
  eveningGame({
    ...at('home', 'bed'),
    ...on(difficulty),
    money: 0,
    ingredients: noIngredients,
    tillCounted: true,
    ...overrides,
  });

/** An evening at the till, with a loan to pay back. */
const owing = (difficulty: Difficulty, money: number, loan = { owed: 2500, missed: 0 }) =>
  eveningGame({ ...at('bakery', 'till'), ...on(difficulty), money, loan });

describe('the difficulty table', () => {
  it('gets easier to harder in every number', () => {
    expect(easy.startingMoney).toBeGreaterThan(medium.startingMoney);
    expect(medium.startingMoney).toBeGreaterThan(hard.startingMoney);
    expect(easy.customerPatienceMs).toBeGreaterThan(medium.customerPatienceMs);
    expect(medium.customerPatienceMs).toBeGreaterThan(hard.customerPatienceMs);
    expect(easy.clockSpeed).toBeLessThan(medium.clockSpeed);
    expect(medium.clockSpeed).toBeLessThan(hard.clockSpeed);
    expect(easy.burnWindowMs).toBeGreaterThan(medium.burnWindowMs);
    expect(medium.burnWindowMs).toBeGreaterThan(hard.burnWindowMs);
  });

  it.each(DIFFICULTY_IDS)('%s starts with enough money to bake', (id) => {
    expect(canAffordABatch(createGame({ seed: 1, difficulty: id }))).toBe(true);
  });

  it('knows a difficulty from anything else', () => {
    expect(isDifficulty('hard')).toBe(true);
    expect(isDifficulty('impossible')).toBe(false);
    expect(isDifficulty(undefined)).toBe(false);
  });
});

describe('starting money', () => {
  it.each(DIFFICULTY_IDS)('a new %s game starts with the money from the table', (id) => {
    const game = createGame({ seed: 1, difficulty: id });
    expect(game.difficulty).toBe(id);
    expect(game.money).toBe(DIFFICULTIES[id].startingMoney);
  });

  it('is Medium when no difficulty, or a made-up one, is given', () => {
    expect(createGame({ seed: 1 }).difficulty).toBe('medium');
    expect(createGame({ seed: 1, difficulty: 'impossible' }).difficulty).toBe('medium');
  });
});

describe('customer patience', () => {
  it('a wait that loses a customer on Hard keeps them on Medium and Easy', () => {
    // Just past Hard's patience on the shop clock, whatever speed the clock runs at.
    const waited = (id: Difficulty) => {
      const game = openGame({ ...on(id), customers: [customer(1, 'cookie')] });
      return tick(game, (hard.customerPatienceMs + 1000) / DIFFICULTIES[id].clockSpeed);
    };
    expect(waited('hard').customers).toHaveLength(0);
    expect(waited('hard').today.lostCustomers).toBe(1);
    expect(waited('medium').customers).toHaveLength(1);
    expect(waited('easy').customers).toHaveLength(1);
  });
});

describe('clock speed', () => {
  it.each(DIFFICULTY_IDS)('one second moves the %s shop clock by its speed', (id) => {
    const game = tick(openGame(on(id)), 1000);
    expect(game.clockMs).toBe(1000 * DIFFICULTIES[id].clockSpeed);
  });

  it('speeds up baking and waiting too', () => {
    const baking = { status: 'baking', recipeId: 'cookie', elapsedMs: 0 } as const;
    const game = tick(
      openGame({ ...on('hard'), oven: baking, customers: [customer(1, 'cookie')] }),
      1000,
    );
    expect(game.oven).toMatchObject({ elapsedMs: 1250 });
    expect(game.customers[0]?.waitedMs).toBe(1250);
  });

  it('never speeds up walking', () => {
    const walked = (id: Difficulty) =>
      tick(tapThing(openGame({ ...on(id), ...at('bakery', 'oven') }), 'till'), 200).baker.walk;
    expect(walked('hard')?.elapsedMs).toBe(200);
    expect(walked('easy')).toEqual(walked('hard'));
  });

  it('the shop closes after less real time on Hard than on Easy', () => {
    const realDay = BALANCE.dayLengthMs / hard.clockSpeed;
    expect(tick(openGame(on('hard')), realDay).phase).toBe('evening');
    expect(tick(openGame(on('medium')), realDay).phase).toBe('open');
    expect(tick(openGame(on('easy')), realDay).phase).toBe('open');
  });

  it('brings customers at the same shop times in one big step or many small ones', () => {
    const start = openGame({ ...on('hard'), nextCustomerInMs: BALANCE.firstCustomerDelayMs });
    const big = tick(start, 40_000);
    let small = start;
    for (let i = 0; i < 400; i++) small = tick(small, 100);
    expect(small.customers.map((c) => c.wants)).toEqual(big.customers.map((c) => c.wants));
    expect(small.rng).toBe(big.rng);
    expect(small.clockMs).toBeCloseTo(big.clockMs, 6);
    expect(big.clockMs).toBeCloseTo(50_000, 6);
  });
});

describe('burn window', () => {
  it('a batch left a while is burnt on Hard and still good on Medium and Easy', () => {
    const elapsedMs = RECIPES.cookie.bakeMs + hard.burnWindowMs;
    const oven = { status: 'baking', recipeId: 'cookie', elapsedMs } as const;
    expect(ovenStage(openGame({ ...on('hard'), oven }))).toBe('burnt');
    expect(ovenStage(openGame({ ...on('medium'), oven }))).toBe('ready');
    expect(ovenStage(openGame({ ...on('easy'), oven }))).toBe('ready');
  });
});

describe('canAffordABatch', () => {
  it('counts what is in the cupboard as well as the money', () => {
    expect(canAffordABatch({ money: 300, ingredients: noIngredients })).toBe(true);
    expect(canAffordABatch({ money: 299, ingredients: noIngredients })).toBe(false);
    expect(canAffordABatch({ money: 0, ingredients: { ...noIngredients, flour: 2, egg: 1 } })).toBe(
      true,
    );
    expect(
      canAffordABatch({ money: 100, ingredients: { ...noIngredients, flour: 1, egg: 1 } }),
    ).toBe(true);
    expect(canAffordABatch({ money: 0, ingredients: { ...noIngredients, butter: 9 } })).toBe(false);
  });
});

describe('running out of money', () => {
  it('does nothing for a baker who can still bake', () => {
    const game = tapThing(broke('hard', { money: 300 }), 'bed');
    expect(game).toMatchObject({ day: 2, money: 300, loan: { owed: 0 } });
    expect(game.message).toEqual({ id: 'goodMorning' });
  });

  it('on Easy, Grandma sends a gift that is never paid back', () => {
    const game = tapThing(broke('easy'), 'bed');
    expect(game).toMatchObject({ day: 2, phase: 'morning', money: 2000, loan: { owed: 0 } });
    expect(game.message).toEqual({ id: 'gift', amount: 2000 });
  });

  it('on Medium, the bank lends money to pay back, with no fee', () => {
    const game = tapThing(broke('medium'), 'bed');
    expect(game).toMatchObject({ money: 2000, loan: { owed: 2000, missed: 0 } });
    expect(game.message).toEqual({ id: 'loan', amount: 2000, owed: 2000, repayment: 500 });
  });

  it('on Hard, the loan comes with a fee', () => {
    const game = tapThing(broke('hard'), 'bed');
    expect(game).toMatchObject({ money: 2000, loan: { owed: 2500, missed: 0 } });
  });

  it('a second loan is added to what is already owed', () => {
    const game = tapThing(broke('hard', { loan: { owed: 1000, missed: 1 } }), 'bed');
    expect(game.loan).toEqual({ owed: 3500, missed: 1 });
  });
});

describe('paying back a loan', () => {
  it('counting the till pays one part, and it is not counted as spending', () => {
    const game = tapThing(owing('medium', 1200), 'till');
    expect(game).toMatchObject({ money: 700, loan: { owed: 2000, missed: 0 } });
    expect(game.today).toMatchObject({ repaid: 500, spent: 0, missedRepayment: false });
    expect(game.panel).toEqual({ type: 'report' });
  });

  it('only pays once an evening', () => {
    const counted = applyAction(tapThing(owing('medium', 1200), 'till'), { type: 'closePanel' });
    expect(tapThing(counted, 'till')).toMatchObject({ money: 700, loan: { owed: 2000 } });
  });

  it('the last part is only what is still owed, and clears the misses', () => {
    const game = tapThing(owing('hard', 1000, { owed: 300, missed: 2 }), 'till');
    expect(game).toMatchObject({ money: 700, loan: { owed: 0, missed: 0 } });
    expect(game.today.repaid).toBe(300);
  });

  it('with too little money the payment is missed and the money is kept', () => {
    const game = tapThing(owing('medium', 499), 'till');
    expect(game).toMatchObject({ money: 499, loan: { owed: 2500, missed: 1 }, ended: false });
    expect(game.today).toMatchObject({ repaid: 0, missedRepayment: true });
  });

  it('missing never ends a Medium game', () => {
    const game = tapThing(owing('medium', 0, { owed: 2500, missed: 99 }), 'till');
    expect(game.ended).toBe(false);
    expect(game.panel).toEqual({ type: 'report' });
  });

  it('on Hard the third miss ends the run, and then nothing changes any more', () => {
    const second = tapThing(owing('hard', 0, { owed: 2500, missed: 1 }), 'till');
    expect(second).toMatchObject({ ended: false, loan: { missed: 2 } });

    const third = tapThing(owing('hard', 0, { owed: 2500, missed: 2 }), 'till');
    expect(third).toMatchObject({ ended: true, panel: null, loan: { missed: 3 } });
    expect(tapThing(third, 'door')).toBe(third);
    expect(applyAction(third, { type: 'pause' })).toBe(third);
    expect(tick(third, 1000)).toBe(third);
  });

  it('Easy never has a loan to pay', () => {
    const game = tapThing(owing('easy', 1200, { owed: 0, missed: 0 }), 'till');
    expect(game).toMatchObject({ money: 1200, today: { repaid: 0 } });
  });

  it('a walk to the till that ends the run stops the clock there', () => {
    const walking = tapThing(
      eveningGame({
        ...at('bakery', 'oven'),
        ...on('hard'),
        loan: { owed: 500, missed: 2 },
        money: 0,
      }),
      'till',
    );
    const game = tick(walking, 60_000);
    expect(game.ended).toBe(true);
    expect(game.baker.walk).toBeNull();
  });
});

describe('resumeGame', () => {
  it('a morning or evening game carries on, standing still with nothing open', () => {
    const walking = tapThing(newGame({ money: 123 }), 'door');
    const game = resumeGame({ ...walking, paused: true, panel: { type: 'report' } });
    expect(game).toMatchObject({ phase: 'morning', money: 123, paused: false, panel: null });
    expect(game.baker).toEqual({ place: 'home', spot: 'bed', walk: null });
  });

  it('keeps the evening where it was', () => {
    const evening = eveningGame({ ...at('bakery', 'till'), tillCounted: true });
    expect(resumeGame(evening)).toEqual(evening);
  });

  it('an open shop starts that day again from the morning, at home', () => {
    const open = goTo(openGame({ day: 3, money: 4200, clockMs: 9000 }), 'oven');
    const game = resumeGame({
      ...open,
      customers: [customer(1, 'cookie')],
      oven: { status: 'baking', recipeId: 'bread', elapsedMs: 5 },
    });
    expect(game).toMatchObject({
      day: 3,
      phase: 'morning',
      money: 4200,
      clockMs: 0,
      customers: [],
      oven: { status: 'empty' },
      ingredients: open.ingredients,
      message: { id: 'goodMorning' },
    });
    expect(game.baker).toEqual({ place: 'home', spot: 'bed', walk: null });
  });
});
