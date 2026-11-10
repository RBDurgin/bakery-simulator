import { describe, expect, it } from 'vitest';
import { BALANCE } from '../content/balance';
import { cleanName, createGame, DEFAULT_BAKERY_NAME, DEFAULT_PLAYER_NAME } from './state';

describe('createGame', () => {
  it('starts on the morning of day one with starting money and empty shelves', () => {
    const game = createGame({ seed: 42, bakeryName: 'Bun Fun', playerName: 'Ada' });
    expect(game).toMatchObject({
      bakeryName: 'Bun Fun',
      playerName: 'Ada',
      day: 1,
      phase: 'morning',
      money: BALANCE.startingMoney,
      rng: 42,
      reputation: BALANCE.startingReputation,
      ingredients: { flour: 0, sugar: 0, butter: 0, egg: 0 },
      shelf: { cookie: 0, muffin: 0, bread: 0 },
      oven: { status: 'empty' },
      customers: [],
      bakerLook: 'baker-1',
      baker: { place: 'home', spot: 'bed', walk: null },
      panel: null,
      message: { id: 'goodMorning' },
      tillCounted: false,
    });
    expect(game.today).toMatchObject({ income: 0, spent: 0, happyCustomers: 0, lostCustomers: 0 });
  });

  it('uses friendly default names', () => {
    const game = createGame({ seed: 1, bakeryName: '   ', playerName: undefined });
    expect(game.bakeryName).toBe(DEFAULT_BAKERY_NAME);
    expect(game.playerName).toBe(DEFAULT_PLAYER_NAME);
  });
});

describe('the baker look', () => {
  it('keeps a look the player picked and replaces one that does not exist', () => {
    expect(createGame({ seed: 1, bakerLook: 'baker-3' }).bakerLook).toBe('baker-3');
    expect(createGame({ seed: 1, bakerLook: 'dragon' }).bakerLook).toBe('baker-1');
  });
});

describe('cleanName', () => {
  it('trims and squeezes spaces', () => {
    expect(cleanName('  Sweet    Treats ', 'x')).toBe('Sweet Treats');
  });

  it('limits the length', () => {
    const long = 'A very long bakery name indeed';
    expect(cleanName(long, 'x')).toBe('A very long bakery n');
    expect(cleanName(long, 'x').length).toBeLessThanOrEqual(BALANCE.nameMaxLength);
  });
});
