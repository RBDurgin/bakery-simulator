import { create } from 'zustand';
import { applyAction, tick, type Action } from '../engine/game';
import { createGame, type GameState } from '../engine/state';
import { readTestHooks } from './testHooks';

export type Screen = 'title' | 'newGame' | 'game';

/** A long frame (a slow phone, a tab that was asleep) never jumps the game far ahead. */
export const MAX_FRAME_MS = 250;

interface GameStore {
  screen: Screen;
  game: GameState | null;
  goTo: (screen: 'title' | 'newGame') => void;
  startNewGame: (names: { bakeryName: string; playerName: string }) => void;
  /** The only way the UI changes game state. */
  dispatch: (action: Action) => void;
  /** Called by the clock with real milliseconds since the last frame. */
  tick: (realMs: number) => void;
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] as number;
}

export const useGameStore = create<GameStore>()((set) => ({
  screen: 'title',
  game: null,
  goTo: (screen) => set({ screen }),
  startNewGame: (names) => {
    const hooks = readTestHooks(window.location.search);
    set({ screen: 'game', game: createGame({ ...names, seed: hooks.seed ?? randomSeed() }) });
  },
  dispatch: (action) => set(({ game }) => (game ? { game: applyAction(game, action) } : {})),
  tick: (realMs) => {
    const speed = readTestHooks(window.location.search).speed ?? 1;
    const ms = Math.min(realMs, MAX_FRAME_MS) * speed;
    set(({ game }) => (game ? { game: tick(game, ms) } : {}));
  },
}));
