import { createGame, type GameState } from '../src/engine/state';

/*
 * Prepared saves for journeys that would take too long to reach by playing.
 * They are built with the game's own engine, so they always have the current
 * save format. Put one in a slot with `putSave` from helpers.ts.
 */
const SAVE_VERSION = 1;

function save(game: GameState, dayStart: GameState = game) {
  return { version: SAVE_VERSION, game, dayStart };
}

function game(difficulty: string, changes: Partial<GameState> = {}): GameState {
  const start = createGame({ seed: 42, bakeryName: 'Bun Fun', playerName: 'Ada', difficulty });
  return { ...start, ...changes };
}

/** Bedtime with no money and an empty cupboard: the next morning brings help. */
export function brokeAtBedtime(difficulty: 'easy' | 'medium' | 'hard') {
  return save(
    game(difficulty, {
      day: 2,
      phase: 'evening',
      money: 0,
      tillCounted: true,
      baker: { place: 'home', spot: 'door', walk: null },
      message: { id: 'arrived', place: 'home' },
    }),
    game(difficulty, { day: 2, money: 0 }),
  );
}

/** A Hard evening at the till with two repayments already missed and no money. */
export function lastChance() {
  const loan = { owed: 2500, missed: 2 };
  return save(
    game('hard', {
      day: 4,
      phase: 'evening',
      money: 0,
      loan,
      baker: { place: 'bakery', spot: 'counter', walk: null },
      message: { id: 'closingTime' },
    }),
    game('hard', { day: 4, money: 2000, loan }),
  );
}

/** An evening with a good day behind it, ready for the till to be counted. */
export function goodEvening() {
  const start = game('medium');
  return save({
    ...start,
    day: 3,
    phase: 'evening',
    money: 7450,
    reputation: 64,
    baker: { place: 'bakery', spot: 'counter', walk: null },
    message: { id: 'closingTime' },
    today: {
      ...start.today,
      income: 2350,
      spent: 900,
      sold: { cookie: 5, muffin: 4, bread: 2 },
      wasted: { cookie: 1, muffin: 0, bread: 0 },
      happyCustomers: 11,
      lostCustomers: 1,
    },
  });
}
