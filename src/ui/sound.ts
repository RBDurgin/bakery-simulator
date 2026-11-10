import { useEffect, useRef } from 'react';
import { ovenStage } from '../engine/selectors';
import type { GameState } from '../engine/state';
import { useSettingsStore } from '../store/settingsStore';

export type SoundId = 'sale' | 'ready' | 'oops' | 'open' | 'close';

/** Each sound is a few short notes, given as pitches in hertz. No audio files are needed. */
const NOTES: Record<SoundId, readonly number[]> = {
  sale: [660, 880],
  ready: [784, 988, 1175],
  oops: [330, 247],
  open: [523, 659, 784],
  close: [784, 659, 523],
};

const NOTE_SECONDS = 0.12;

let context: AudioContext | null = null;

/** Plays a sound. Does nothing where the browser has no sound, and never throws. */
export function playSound(id: SoundId): void {
  try {
    if (typeof window.AudioContext !== 'function') return;
    context ??= new window.AudioContext();
    const audio = context;
    NOTES[id].forEach((pitch, index) => {
      const start = audio.currentTime + index * NOTE_SECONDS;
      const note = audio.createOscillator();
      const volume = audio.createGain();
      note.type = 'triangle';
      note.frequency.value = pitch;
      // A quick fade in and out, so notes never click.
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.linearRampToValueAtTime(0.15, start + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + NOTE_SECONDS);
      note.connect(volume).connect(audio.destination);
      note.start(start);
      note.stop(start + NOTE_SECONDS);
    });
  } catch {
    // Sound is an extra. The game goes on without it.
  }
}

/** The sound for what just changed in the game, if any. */
export function soundFor(before: GameState, after: GameState): SoundId | null {
  if (ovenStage(after) === 'ready' && ovenStage(before) !== 'ready') return 'ready';
  if (after.message === before.message) return null;
  switch (after.message?.id) {
    case 'served':
      return 'sale';
    case 'burnt':
      return 'oops';
    case 'shopOpened':
      return 'open';
    case 'closingTime':
      return 'close';
    default:
      return null;
  }
}

/** Plays the game's sounds as things happen, while sound is switched on. */
export function useSounds(game: GameState | null) {
  const enabled = useSettingsStore((store) => store.settings.sound);
  const last = useRef(game);

  useEffect(() => {
    const before = last.current;
    last.current = game;
    if (!enabled || !before || !game) return;
    const sound = soundFor(before, game);
    if (sound) playSound(sound);
  }, [game, enabled]);
}
