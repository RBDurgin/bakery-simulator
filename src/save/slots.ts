import type { GameState } from '../engine/state';
import { migrate } from './migrations';
import { parseSave, SAVE_VERSION, type SaveFile } from './schema';
import { readJson, remove, slotKey, writeJson } from './storage';

export const SLOT_IDS = [1, 2, 3] as const;

export type SlotId = (typeof SLOT_IDS)[number];

export type Slot =
  | { status: 'empty' }
  | { status: 'saved'; save: SaveFile }
  /** There is something in the slot, but it cannot be read. */
  | { status: 'damaged' };

/** Reads one slot: migrates old saves, checks the result, and never throws. */
export function readSlot(slot: SlotId): Slot {
  const stored = readJson(slotKey(slot));
  if (stored.status !== 'found') return stored;
  const save = parseSave(migrate(stored.data));
  return save ? { status: 'saved', save } : { status: 'damaged' };
}

export function readSlots(): Record<SlotId, Slot> {
  return { 1: readSlot(1), 2: readSlot(2), 3: readSlot(3) };
}

/** Saves a game into a slot. False means it could not be stored. */
export function writeSlot(slot: SlotId, game: GameState, dayStart: GameState): boolean {
  const save: SaveFile = { version: SAVE_VERSION, game, dayStart };
  return writeJson(slotKey(slot), save);
}

export function deleteSlot(slot: SlotId): boolean {
  return remove(slotKey(slot));
}
