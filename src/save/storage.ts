/*
 * The only file that touches local storage. Browsers can block storage or
 * run out of room, and both show up as thrown errors, so every call here is
 * guarded: reading never throws and writing gives false instead.
 */
const PREFIX = 'bakery-simulator';

export const SETTINGS_KEY = `${PREFIX}.settings`;

export function slotKey(slot: number): string {
  return `${PREFIX}.save.${slot}`;
}

export type ReadResult =
  | { status: 'empty' }
  | { status: 'found'; data: unknown }
  /** Something is stored but it is not readable data. */
  | { status: 'damaged' };

export function readJson(key: string): ReadResult {
  let stored: string | null;
  try {
    stored = window.localStorage.getItem(key);
  } catch {
    // Blocked storage holds nothing we can use.
    return { status: 'empty' };
  }
  if (stored === null) return { status: 'empty' };
  try {
    return { status: 'found', data: JSON.parse(stored) as unknown };
  } catch {
    return { status: 'damaged' };
  }
}

export function writeJson(key: string, data: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
