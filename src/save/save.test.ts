import { afterEach, describe, expect, it, vi } from 'vitest';
import { tick } from '../engine/game';
import { createGame, type GameState } from '../engine/state';
import { customer, eveningGame, newGame, openGame, tapThing } from '../test/fixtures';
import { migrate, MIGRATIONS, type Migration } from './migrations';
import { parseGame, parseSave, SAVE_VERSION } from './schema';
import { DEFAULT_SETTINGS, readSettings, writeSettings } from './settings';
import { deleteSlot, readSlot, readSlots, SLOT_IDS, writeSlot } from './slots';
import { readJson, remove, SETTINGS_KEY, slotKey, writeJson } from './storage';

/** What a game looks like after a trip through storage. */
const stored = (game: GameState): unknown => JSON.parse(JSON.stringify(game));

/** A stored game with one part changed, as a damaged save would have. */
const damaged = (changes: Record<string, unknown>): unknown => ({
  ...(stored(newGame()) as Record<string, unknown>),
  ...changes,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseGame', () => {
  it('reads back a new game exactly', () => {
    const game = createGame({
      seed: 7,
      bakeryName: 'Bun Fun',
      playerName: 'Ada',
      difficulty: 'hard',
    });
    expect(parseGame(stored(game))).toEqual(game);
  });

  it('reads back a busy shop', () => {
    const game = tick(
      openGame({
        day: 4,
        customers: [customer(3, 'bread', 1200.5)],
        oven: { status: 'baking', recipeId: 'muffin', elapsedMs: 10.25 },
        shelf: { cookie: 2, muffin: 0, bread: 1 },
        message: { id: 'served', recipeId: 'cookie' },
        nextCustomerInMs: 5000,
      }),
      16.7,
    );
    expect(parseGame(stored(game))).toEqual(game);
  });

  it.each<GameState['message']>([
    null,
    { id: 'arrived', place: 'market' },
    { id: 'gift', amount: 2000 },
    { id: 'loan', amount: 2000, owed: 2500, repayment: 500 },
    { id: 'tookOut', recipeId: 'bread' },
    { id: 'goHome' },
  ])('reads back the message %j', (message) => {
    expect(parseGame(stored(newGame({ message })))?.message).toEqual(message);
  });

  it('reads back an evening with a loan', () => {
    const game = eveningGame({
      tillCounted: true,
      loan: { owed: 1500, missed: 2 },
      today: { ...eveningGame().today, repaid: 500, missedRepayment: true, income: 800 },
    });
    expect(parseGame(stored(game))).toEqual(game);
  });

  it('never keeps a walk, an open panel or a pause', () => {
    const walking = tapThing(newGame(), 'door');
    expect(walking.baker.walk).not.toBeNull();
    const game = parseGame(stored({ ...walking, paused: true, panel: { type: 'oven' } }));
    expect(game).toMatchObject({ paused: false, panel: null });
    expect(game?.baker).toEqual({ place: 'home', spot: 'bed', walk: null });
  });

  it('drops anything it does not know', () => {
    const game = parseGame(damaged({ cheat: true }));
    expect(game).toEqual(newGame());
  });

  it.each([
    ['nothing', null],
    ['a word', 'save'],
    ['a list', []],
    ['an empty object', {}],
  ])('gives null for %s', (_, value) => {
    expect(parseGame(value)).toBeNull();
  });

  it.each<[string, Record<string, unknown>]>([
    ['money that is not whole cents', { money: 12.5 }],
    ['negative money', { money: -1 }],
    ['money that is not a number', { money: '6000' }],
    ['money that is not finite', { money: Infinity }],
    ['day zero', { day: 0 }],
    ['an unknown phase', { phase: 'night' }],
    ['an unknown difficulty', { difficulty: 'impossible' }],
    ['an unknown look', { bakerLook: 'robot' }],
    ['a name that is too long', { bakeryName: 'x'.repeat(50) }],
    ['a name that is not text', { playerName: 5 }],
    ['an empty name', { playerName: '' }],
    ['a seed that is too big', { rng: 2 ** 32 }],
    ['a reputation over 100', { reputation: 101 }],
    ['a missing ingredient', { ingredients: { flour: 1, sugar: 1, butter: 1 } }],
    ['a shelf that is a list', { shelf: [1, 2, 3] }],
    ['an oven in an unknown state', { oven: { status: 'on fire' } }],
    [
      'an oven with an unknown recipe',
      { oven: { status: 'baking', recipeId: 'pie', elapsedMs: 0 } },
    ],
    ['customers that are not a list', { customers: {} }],
    [
      'a customer who wants an unknown recipe',
      { customers: [{ id: 1, wants: 'pie', waitedMs: 0 }] },
    ],
    [
      'two customers with the same number',
      {
        customers: [
          { id: 1, wants: 'cookie', waitedMs: 0 },
          { id: 1, wants: 'bread', waitedMs: 0 },
        ],
      },
    ],
    ['a time that is not a number', { nextCustomerInMs: null }],
    ['a baker in an unknown place', { baker: { place: 'moon', spot: 'bed', walk: null } }],
    ['a baker on an unknown spot', { baker: { place: 'home', spot: 'roof', walk: null } }],
    ['an unknown message', { message: { id: 'hello' } }],
    ['a message about an unknown place', { message: { id: 'arrived', place: 'moon' } }],
    ['a message about an unknown recipe', { message: { id: 'served', recipeId: 'pie' } }],
    ['a message that is not an object', { message: 'hello' }],
    ['a flag that is not true or false', { tillCounted: 'yes' }],
    ['a missing loan', { loan: undefined }],
    ['a negative loan', { loan: { owed: -5, missed: 0 } }],
    ['a missing day report', { today: null }],
  ])('gives null for %s', (_, changes) => {
    expect(parseGame(damaged(changes))).toBeNull();
  });
});

describe('parseSave', () => {
  const game = eveningGame({ day: 2 });
  const dayStart = newGame({ day: 2 });

  it('reads a save of the current version', () => {
    const save = parseSave({
      version: SAVE_VERSION,
      game: stored(game),
      dayStart: stored(dayStart),
    });
    expect(save).toEqual({ version: SAVE_VERSION, game, dayStart });
  });

  it.each([
    ['nothing', null],
    [
      'another version',
      { version: SAVE_VERSION + 1, game: stored(game), dayStart: stored(dayStart) },
    ],
    [
      'a damaged game',
      { version: SAVE_VERSION, game: damaged({ money: -1 }), dayStart: stored(dayStart) },
    ],
    ['a missing day start', { version: SAVE_VERSION, game: stored(game) }],
  ])('gives null for %s', (_, value) => {
    expect(parseSave(value)).toBeNull();
  });
});

describe('migrate', () => {
  /** Made-up old formats, to test the steps without real ones: v1 { coins }, v2 { cents }. */
  const steps: Record<number, Migration> = {
    1: (old) => ({ cents: (old.coins as number) * 100 }),
    2: (old) => ({ money: old.cents, bakeryName: 'Sunny Bakery' }),
  };

  it('has no steps yet, because version 1 is the first format', () => {
    expect(SAVE_VERSION).toBe(1);
    expect(Object.keys(MIGRATIONS)).toEqual([]);
  });

  it('leaves data of the current version alone', () => {
    const data = { version: SAVE_VERSION, game: {} };
    expect(migrate(data)).toBe(data);
  });

  it('runs every step in order up to the target version', () => {
    expect(migrate({ version: 1, coins: 12 }, steps, 3)).toEqual({
      version: 3,
      money: 1200,
      bakeryName: 'Sunny Bakery',
    });
    expect(migrate({ version: 2, cents: 5 }, steps, 3)).toMatchObject({ version: 3, money: 5 });
  });

  it.each([
    ['data that is not an object', 'save'],
    ['a list', [1]],
    ['nothing', null],
    ['data with no version', { coins: 1 }],
    ['a version that is not a whole number', { version: 1.5 }],
    ['version zero', { version: 0 }],
    ['a save from a newer game', { version: 4 }],
  ])('gives null for %s', (_, data) => {
    expect(migrate(data, steps, 3)).toBeNull();
  });

  it('gives null when a step is missing or fails', () => {
    expect(migrate({ version: 1 }, { 2: steps[2]! }, 3)).toBeNull();
    const broken: Record<number, Migration> = {
      1: () => {
        throw new Error('bad save');
      },
    };
    expect(migrate({ version: 1 }, broken, 2)).toBeNull();
  });
});

describe('storage', () => {
  it('reads back what it wrote, and nothing after removing it', () => {
    expect(readJson('test')).toEqual({ status: 'empty' });
    expect(writeJson('test', { a: 1 })).toBe(true);
    expect(readJson('test')).toEqual({ status: 'found', data: { a: 1 } });
    expect(remove('test')).toBe(true);
    expect(readJson('test')).toEqual({ status: 'empty' });
  });

  it('reports data that is not JSON as damaged', () => {
    window.localStorage.setItem('test', '{oops');
    expect(readJson('test')).toEqual({ status: 'damaged' });
  });

  it('never throws when storage is blocked or full', () => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);
    expect(readJson('test')).toEqual({ status: 'empty' });
    expect(writeJson('test', 1)).toBe(false);
    expect(remove('test')).toBe(false);
  });
});

describe('save slots', () => {
  const game = eveningGame({ day: 3, bakeryName: 'Bun Fun' });
  const dayStart = newGame({ day: 3, bakeryName: 'Bun Fun' });

  it('starts with three empty slots', () => {
    expect(SLOT_IDS).toEqual([1, 2, 3]);
    expect(readSlots()).toEqual({
      1: { status: 'empty' },
      2: { status: 'empty' },
      3: { status: 'empty' },
    });
  });

  it('saves into one slot and leaves the others alone', () => {
    expect(writeSlot(2, game, dayStart)).toBe(true);
    expect(readSlot(2)).toEqual({
      status: 'saved',
      save: { version: SAVE_VERSION, game, dayStart },
    });
    expect(readSlot(1)).toEqual({ status: 'empty' });
    expect(readSlot(3)).toEqual({ status: 'empty' });
  });

  it('gives each slot its own key in storage', () => {
    writeSlot(1, game, dayStart);
    writeSlot(3, dayStart, dayStart);
    expect(Object.keys(window.localStorage).sort()).toEqual([slotKey(1), slotKey(3)]);
  });

  it('deletes one slot', () => {
    writeSlot(1, game, dayStart);
    writeSlot(2, game, dayStart);
    expect(deleteSlot(1)).toBe(true);
    expect(readSlot(1)).toEqual({ status: 'empty' });
    expect(readSlot(2).status).toBe('saved');
  });

  it.each([
    ['text that is not JSON', '{"version":1,"game":'],
    ['JSON that is not a save', '"hello"'],
    ['a save with no version', JSON.stringify({ game, dayStart })],
    ['a save from a newer game', JSON.stringify({ version: 99, game, dayStart })],
    [
      'a save with a broken game',
      JSON.stringify({ version: 1, game: { ...game, money: 'lots' }, dayStart }),
    ],
  ])('reports %s as damaged, without throwing', (_, text) => {
    window.localStorage.setItem(slotKey(1), text);
    expect(readSlot(1)).toEqual({ status: 'damaged' });
  });
});

describe('settings', () => {
  it('starts with the defaults', () => {
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({ sound: true, reducedMotion: null, textSize: 'normal' });
  });

  it('reads back what was stored, under its own key', () => {
    const settings = { sound: false, reducedMotion: true, textSize: 'larger' } as const;
    expect(writeSettings(settings)).toBe(true);
    expect(readSettings()).toEqual(settings);
    expect(Object.keys(window.localStorage)).toEqual([SETTINGS_KEY]);
  });

  it.each([
    ['text that is not JSON', 'oops'],
    ['JSON that is not an object', '7'],
    ['nothing useful', 'null'],
    [
      'wrong kinds of values',
      JSON.stringify({ sound: 'loud', reducedMotion: 1, textSize: 'huge' }),
    ],
  ])('falls back to the defaults for %s', (_, text) => {
    window.localStorage.setItem(SETTINGS_KEY, text);
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps the good parts of settings that are partly wrong', () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: false, textSize: 'huge' }));
    expect(readSettings()).toEqual({ ...DEFAULT_SETTINGS, sound: false });
  });
});
