import { create } from 'zustand';
import { applyAction, tick, type Action } from '../engine/game';
import { createGame, type GameState } from '../engine/state';
import { leavingAfter, type Leaving } from './leaving';
import { readTestHooks } from './testHooks';

export type Screen = 'title' | 'newGame' | 'game';

/** A long frame (a slow phone, a tab that was asleep) never jumps the game far ahead. */
export const MAX_FRAME_MS = 250;

interface GameStore {
  screen: Screen;
  game: GameState | null;
  /** Customers who have just left, for the scene to show walking out. */
  leaving: Leaving[];
  goTo: (screen: 'title' | 'newGame') => void;
  startNewGame: (choices: { bakeryName: string; playerName: string; bakerLook?: string }) => void;
  /** The only way the UI changes game state. */
  dispatch: (action: Action) => void;
  /** Called by the clock with real milliseconds since the last frame. */
  tick: (realMs: number) => void;
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] as number;
}

function step(before: GameState, after: GameState, leaving: Leaving[]) {
  return { game: after, leaving: leavingAfter(before, after, leaving) };
}

export const useGameStore = create<GameStore>()((set) => ({
  screen: 'title',
  game: null,
  leaving: [],
  goTo: (screen) => set({ screen }),
  startNewGame: (choices) => {
    const hooks = readTestHooks(window.location.search);
    const game = createGame({ ...choices, seed: hooks.seed ?? randomSeed() });
    set({ screen: 'game', game, leaving: [] });
  },
  dispatch: (action) =>
    set(({ game, leaving }) => (game ? step(game, applyAction(game, action), leaving) : {})),
  tick: (realMs) => {
    const speed = readTestHooks(window.location.search).speed ?? 1;
    const ms = Math.min(realMs, MAX_FRAME_MS) * speed;
    set(({ game, leaving }) => (game ? step(game, tick(game, ms), leaving) : {}));
  },
}));
