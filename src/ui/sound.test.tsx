import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RECIPES } from '../content/recipes';
import type { GameState } from '../engine/state';
import { useSettingsStore } from '../store/settingsStore';
import { eveningGame, newGame, openGame } from '../test/fixtures';
import { playSound, soundFor, useSounds } from './sound';

const baking = (elapsedMs: number) =>
  openGame({ oven: { status: 'baking', recipeId: 'cookie', elapsedMs } });

// The sound module keeps one audio context for the whole page, so the tests share one too.
const started = vi.fn();

/** A stand-in for the browser's sound, which jsdom does not have. */
function stubAudio() {
  started.mockReset();
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  class FakeAudioContext {
    currentTime = 0;
    destination = {};
    createOscillator() {
      const node = {
        type: '',
        frequency: param(),
        connect: (next: unknown) => next,
        start: started,
        stop: vi.fn(),
      };
      return node;
    }
    createGain() {
      return { gain: param(), connect: vi.fn() };
    }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
  return started;
}

function Sounds({ game }: { game: GameState | null }) {
  useSounds(game);
  return null;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('soundFor', () => {
  it('rings when a batch becomes ready, once', () => {
    const { bakeMs } = RECIPES.cookie;
    expect(soundFor(baking(bakeMs - 1), baking(bakeMs))).toBe('ready');
    expect(soundFor(baking(bakeMs), baking(bakeMs + 1))).toBeNull();
  });

  it.each([
    [{ id: 'served', recipeId: 'cookie' }, 'sale'],
    [{ id: 'burnt', recipeId: 'cookie' }, 'oops'],
    [{ id: 'shopOpened' }, 'open'],
    [{ id: 'closingTime' }, 'close'],
    [{ id: 'shelf' }, null],
    [null, null],
  ] as const)('for the message %j plays %s', (message, sound) => {
    expect(soundFor(newGame(), newGame({ message }))).toBe(sound);
  });

  it('is quiet while the same message stays up', () => {
    const game = eveningGame({ message: { id: 'closingTime' } });
    expect(soundFor(game, { ...game, money: 5 })).toBeNull();
  });
});

describe('playSound', () => {
  it('does nothing, quietly, where the browser has no sound', () => {
    expect(() => playSound('sale')).not.toThrow();
  });

  it('plays one note for each pitch, and never throws', () => {
    const started = stubAudio();
    playSound('ready');
    expect(started).toHaveBeenCalledTimes(3);

    started.mockImplementation(() => {
      throw new Error('no sound card');
    });
    expect(() => playSound('sale')).not.toThrow();
  });
});

describe('useSounds', () => {
  it('plays as things happen, and stays quiet when sound is off', () => {
    const started = stubAudio();
    const first = newGame();
    const { rerender } = render(<Sounds game={first} />);
    expect(started).not.toHaveBeenCalled();

    rerender(<Sounds game={{ ...first, message: { id: 'shopOpened' } }} />);
    expect(started).toHaveBeenCalledTimes(3);

    act(() => useSettingsStore.getState().change({ sound: false }));
    rerender(<Sounds game={{ ...first, message: { id: 'closingTime' } }} />);
    rerender(<Sounds game={null} />);
    expect(started).toHaveBeenCalledTimes(3);
  });
});
