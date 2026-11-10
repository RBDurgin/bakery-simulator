import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSlot, writeSlot } from '../save/slots';
import { slotKey } from '../save/storage';
import { at, eveningGame, newGame, openGame, tapThing } from '../test/fixtures';
import { isAutosavePoint, useGameStore } from './gameStore';
import { useSettingsStore } from './settingsStore';

const store = () => useGameStore.getState();
const tap = (id: string) => store().dispatch({ type: 'tap', target: { kind: 'thing', id } });
const saved = (slot: 1 | 2 | 3) => {
  const stored = readSlot(slot);
  if (stored.status !== 'saved') throw new Error(`Slot ${slot} is ${stored.status}`);
  return stored.save;
};

/** Starts a game in a slot, as the new game form does. */
function startIn(slot: 1 | 2 | 3, bakeryName = 'Bun Fun') {
  store().newGameIn(slot);
  store().startNewGame({ bakeryName, playerName: 'Ada' });
}

/** Lets the baker finish walking. */
function arrive() {
  for (let i = 0; i < 100 && store().game?.baker.walk; i++) store().tick(250);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isAutosavePoint', () => {
  const morning = newGame();

  it('is the end of each phase, and the till being counted', () => {
    expect(isAutosavePoint(morning, { ...morning, phase: 'open' })).toBe(true);
    expect(isAutosavePoint(openGame(), eveningGame())).toBe(true);
    expect(isAutosavePoint(eveningGame(), eveningGame({ tillCounted: true }))).toBe(true);
    expect(isAutosavePoint(eveningGame({ tillCounted: true }), { ...morning, day: 2 })).toBe(true);
  });

  it('is not every little change, and never a run that has ended', () => {
    expect(isAutosavePoint(morning, { ...morning, money: 5 })).toBe(false);
    expect(isAutosavePoint(openGame(), openGame({ clockMs: 500 }))).toBe(false);
    expect(isAutosavePoint(eveningGame(), eveningGame({ tillCounted: true, ended: true }))).toBe(
      false,
    );
  });
});

describe('saving', () => {
  it('saves a new game into its slot straight away', () => {
    startIn(2);
    expect(store().slot).toBe(2);
    expect(saved(2).game).toMatchObject({ bakeryName: 'Bun Fun', day: 1, phase: 'morning' });
    expect(saved(2).dayStart).toEqual(saved(2).game);
    expect(readSlot(1).status).toBe('empty');
  });

  it('does not save a game that has no slot', () => {
    store().startNewGame({ bakeryName: 'Bun Fun', playerName: 'Ada' });
    tap('door');
    arrive();
    store().saveNow();
    expect(window.localStorage).toHaveLength(0);
  });

  it('does not save while the morning goes on, only when the shop opens', () => {
    startIn(1);
    tap('door');
    arrive();
    expect(store().game?.baker.place).toBe('street');
    expect(saved(1).game.baker.place).toBe('home');

    useGameStore.setState({ game: newGame({ ...at('bakery', 'door'), money: 5700 }) });
    tap('sign');
    tap('sign');
    expect(store().game?.phase).toBe('open');
    expect(saved(1).game).toMatchObject({ phase: 'open', money: 5700, clockMs: 0 });
  });

  it('saves when the shop closes, when the till is counted, and at bedtime', () => {
    startIn(1);
    useGameStore.setState({ game: openGame({ ...at('bakery', 'till'), money: 1234 }) });
    store().tick(100);
    expect(saved(1).game.phase).toBe('morning');

    store().dispatch({ type: 'closeShop' });
    expect(saved(1).game).toMatchObject({ phase: 'evening', tillCounted: false, money: 1234 });

    tap('till');
    expect(saved(1).game.tillCounted).toBe(true);

    useGameStore.setState({ game: eveningGame({ ...at('home', 'bed'), tillCounted: true }) });
    tap('bed');
    expect(saved(1).game).toMatchObject({ day: 2, phase: 'morning' });
    expect(saved(1).dayStart).toMatchObject({ day: 2, phase: 'morning' });
    expect(store().dayStart?.day).toBe(2);
  });

  it('keeps three slots separate', () => {
    startIn(1, 'One');
    store().quitToTitle();
    startIn(2, 'Two');
    store().quitToTitle();
    startIn(3, 'Three');
    useGameStore.setState({ game: eveningGame({ ...at('home', 'bed'), tillCounted: true }) });
    tap('bed');
    store().quitToTitle();

    expect(saved(1).game).toMatchObject({ bakeryName: 'One', day: 1 });
    expect(saved(2).game).toMatchObject({ bakeryName: 'Two', day: 1 });
    expect(saved(3).game.day).toBe(2);
  });
});

describe('leaving and coming back', () => {
  it('quitting in the morning saves where the baker is, and goes to the title', () => {
    startIn(1);
    tap('door');
    arrive();
    store().quitToTitle();
    expect(store()).toMatchObject({ screen: 'title', game: null, slot: null, dayStart: null });
    expect(saved(1).game.baker.place).toBe('street');
  });

  it('continues a saved game', () => {
    startIn(3);
    tap('door');
    arrive();
    store().quitToTitle();

    store().continueGame(3);
    expect(store()).toMatchObject({ screen: 'game', slot: 3, saveFailed: false });
    expect(store().game).toMatchObject({ bakeryName: 'Bun Fun', phase: 'morning' });
    expect(store().game?.baker).toEqual({ place: 'street', spot: 'home', walk: null });
    expect(store().dayStart?.baker.place).toBe('home');
  });

  it('a shop that was open starts that day again from the morning', () => {
    startIn(1);
    useGameStore.setState({ game: newGame({ ...at('bakery', 'door'), money: 5000 }) });
    tap('sign');
    tap('sign');
    store().tick(250);
    expect(store().game?.clockMs).toBeGreaterThan(0);

    store().dispatch({ type: 'pause' });
    store().saveNow();
    store().quitToTitle();
    store().continueGame(1);
    expect(store().game).toMatchObject({
      phase: 'morning',
      money: 5000,
      clockMs: 0,
      paused: false,
    });
    expect(store().game?.baker.place).toBe('home');
  });

  it('does not open an empty or a damaged slot', () => {
    store().goTo('slots');
    store().continueGame(1);
    expect(store()).toMatchObject({ screen: 'slots', game: null });

    window.localStorage.setItem(slotKey(2), 'not a save');
    store().continueGame(2);
    expect(store()).toMatchObject({ screen: 'slots', game: null });
    expect(store().slots[2]).toEqual({ status: 'damaged' });
  });

  it('reads the slots when the slots screen opens, and after deleting', () => {
    writeSlot(1, newGame(), newGame());
    expect(store().slots[1].status).toBe('empty');
    store().goTo('slots');
    expect(store().slots[1].status).toBe('saved');

    store().deleteSave(1);
    expect(store().slots[1].status).toBe('empty');
    expect(readSlot(1).status).toBe('empty');
  });
});

describe('a run that has ended', () => {
  const lastChance = () =>
    eveningGame({
      ...at('bakery', 'till'),
      difficulty: 'hard',
      money: 0,
      loan: { owed: 2500, missed: 2 },
    });

  it('is not saved, and the day can be tried again from its morning', () => {
    startIn(1);
    const dayStart = newGame({ day: 4, difficulty: 'hard', loan: { owed: 2500, missed: 2 } });
    useGameStore.setState({ game: lastChance(), dayStart });
    writeSlot(1, lastChance(), dayStart);

    tap('till');
    expect(store().game?.ended).toBe(true);
    expect(saved(1).game.ended).toBe(false);

    store().retryDay();
    expect(store().game).toEqual(dayStart);
    expect(saved(1).game).toEqual(dayStart);
  });

  it('is not saved on leaving either', () => {
    startIn(1);
    useGameStore.setState({ game: { ...lastChance(), ended: true } });
    store().quitToTitle();
    expect(saved(1).game.ended).toBe(false);
  });

  it('retrying does nothing when there is no game', () => {
    store().retryDay();
    expect(store().game).toBeNull();
  });
});

describe('when storage fails', () => {
  it('keeps the game going in memory and says so', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    startIn(1);
    expect(store()).toMatchObject({ screen: 'game', saveFailed: true });
    tap('door');
    arrive();
    expect(store().game?.baker.place).toBe('street');

    vi.restoreAllMocks();
    store().saveNow();
    expect(store().saveFailed).toBe(false);
    expect(saved(1).game.baker.place).toBe('street');
  });
});

describe('settings store', () => {
  it('changes settings and stores them apart from the saves', () => {
    useSettingsStore.getState().change({ sound: false });
    useSettingsStore.getState().change({ textSize: 'large' });
    expect(useSettingsStore.getState().settings).toEqual({
      sound: false,
      reducedMotion: null,
      textSize: 'large',
    });
    expect(Object.keys(window.localStorage)).toEqual(['bakery-simulator.settings']);
  });

  it('keeps a choice for now even when it cannot be stored', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    useSettingsStore.getState().change({ reducedMotion: true });
    expect(useSettingsStore.getState().settings.reducedMotion).toBe(true);
  });
});

// Keeps the helper honest: tapping needs a game on a real spot.
it('the fixtures still tap things', () => {
  expect(tapThing(newGame(), 'door').baker.walk).not.toBeNull();
});
