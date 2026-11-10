import { readJson, SETTINGS_KEY, writeJson } from './storage';

export const TEXT_SIZES = ['normal', 'large', 'larger'] as const;

export type TextSize = (typeof TEXT_SIZES)[number];

/** Choices that belong to the device, not to one save slot. */
export interface Settings {
  sound: boolean;
  /** True for less movement, false for full movement, null to follow the device's own setting. */
  reducedMotion: boolean | null;
  textSize: TextSize;
}

export const DEFAULT_SETTINGS: Settings = { sound: true, reducedMotion: null, textSize: 'normal' };

/** Reads the stored settings. Anything missing or wrong falls back to its default. */
export function readSettings(): Settings {
  const stored = readJson(SETTINGS_KEY);
  const raw =
    stored.status === 'found' && typeof stored.data === 'object' && stored.data !== null
      ? (stored.data as Record<string, unknown>)
      : {};
  const { sound, reducedMotion, textSize } = raw;
  return {
    sound: typeof sound === 'boolean' ? sound : DEFAULT_SETTINGS.sound,
    reducedMotion: typeof reducedMotion === 'boolean' ? reducedMotion : null,
    textSize: TEXT_SIZES.includes(textSize as TextSize)
      ? (textSize as TextSize)
      : DEFAULT_SETTINGS.textSize,
  };
}

/** Stores the settings. False means they could not be stored. */
export function writeSettings(settings: Settings): boolean {
  return writeJson(SETTINGS_KEY, settings);
}
