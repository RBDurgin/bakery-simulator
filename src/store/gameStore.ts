import { create } from 'zustand';
import { applyAction, resumeGame, tick, type Action } from '../engine/game';
import { createGame, type GameState } from '../engine/state';
import { deleteSlot, readSlot, readSlots, writeSlot, type Slot, type SlotId } from '../save/slots';
import { leavingAfter, type Leaving } from './leaving';
import { readTestHooks } from './testHooks';

export type Screen = 'title' | 'slots' | 'newGame' | 'game';

/** A long frame (a slow phone, a tab that was asleep) never jumps the game far ahead. */
export const MAX_FRAME_MS = 250;

export interface NewGameChoices {
  bakeryName: string;
  playerName: string;
  bakerLook?: string;
  difficulty?: string;
}

interface GameStore {
  screen: Screen;
  game: GameState | null;
  /** The save slot the game is played in. A game with no slot is not saved. */
  slot: SlotId | null;
  /** The game as it was when the baker woke up today, for trying the day again. */
  dayStart: GameState | null;
  /** What is in the save slots, as last read from storage. */
  slots: Record<SlotId, Slot>;
  /** True when the last save could not be stored. The game goes on in memory. */
  saveFailed: boolean;
  /** Customers who have just left, for the scene to show walking out. */
  leaving: Leaving[];
  goTo: (screen: 'title' | 'slots') => void;
  /** Opens the new game form for a slot. */
  newGameIn: (slot: SlotId) => void;
  startNewGame: (choices: NewGameChoices) => void;
  /** Loads the save in a slot and carries on playing. */
  continueGame: (slot: SlotId) => void;
  deleteSave: (slot: SlotId) => void;
  /** Starts today again from the morning. Offered when a run has ended. */
  retryDay: () => void;
  /** Saves now, unless the shop is open: an open day always starts again from its morning. */
  saveNow: () => void;
  /** Saves if it can and goes back to the title screen. */
  quitToTitle: () => void;
  /** The only way the UI changes game state. */
  dispatch: (action: Action) => void;
  /** Called by the clock with real milliseconds since the last frame. */
  tick: (realMs: number) => void;
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] as number;
}

/** The moments the game saves itself: the end of each phase, and the till being counted. */
export function isAutosavePoint(before: GameState, after: GameState): boolean {
  if (after.ended) return false;
  return (
    after.day !== before.day ||
    after.phase !== before.phase ||
    (after.tillCounted && !before.tillCounted)
  );
}

export const useGameStore = create<GameStore>()((set, get) => {
  /** Writes the game into its slot and remembers whether that worked. */
  const save = () => {
    const { slot, game, dayStart } = get();
    if (slot === null || !game || !dayStart) return;
    set({ saveFailed: !writeSlot(slot, game, dayStart) });
  };

  /** Puts a new engine state in place, and saves at the autosave points. */
  const step = (after: GameState) => {
    const { game: before, leaving, dayStart } = get();
    if (!before || after === before) return;
    set({
      game: after,
      leaving: leavingAfter(before, after, leaving),
      dayStart: after.day === before.day ? dayStart : after,
    });
    if (isAutosavePoint(before, after)) save();
  };

  /** Starts playing a game, new or loaded. */
  const play = (slot: SlotId | null, game: GameState, dayStart: GameState) => {
    set({ screen: 'game', slot, game, dayStart, leaving: [], saveFailed: false });
  };

  return {
    screen: 'title',
    game: null,
    slot: null,
    dayStart: null,
    slots: { 1: { status: 'empty' }, 2: { status: 'empty' }, 3: { status: 'empty' } },
    saveFailed: false,
    leaving: [],
    goTo: (screen) => set(screen === 'slots' ? { screen, slots: readSlots() } : { screen }),
    newGameIn: (slot) => set({ screen: 'newGame', slot }),
    startNewGame: (choices) => {
      const hooks = readTestHooks(window.location.search);
      const game = createGame({ ...choices, seed: hooks.seed ?? randomSeed() });
      play(get().slot, game, game);
      save();
    },
    continueGame: (slot) => {
      const stored = readSlot(slot);
      if (stored.status !== 'saved') {
        // The save has gone or broken since the list was shown.
        set({ slots: readSlots() });
        return;
      }
      play(slot, resumeGame(stored.save.game), stored.save.dayStart);
    },
    deleteSave: (slot) => {
      deleteSlot(slot);
      set({ slots: readSlots() });
    },
    retryDay: () => {
      const { slot, dayStart } = get();
      if (!dayStart) return;
      play(slot, resumeGame(dayStart), dayStart);
      save();
    },
    saveNow: () => {
      const { game } = get();
      if (game && game.phase !== 'open' && !game.ended) save();
    },
    quitToTitle: () => {
      get().saveNow();
      set({ screen: 'title', game: null, slot: null, dayStart: null, leaving: [] });
    },
    dispatch: (action) => {
      const { game } = get();
      if (game) step(applyAction(game, action));
    },
    tick: (realMs) => {
      const { game } = get();
      if (!game) return;
      const speed = readTestHooks(window.location.search).speed ?? 1;
      step(tick(game, Math.min(realMs, MAX_FRAME_MS) * speed));
    },
  };
});
