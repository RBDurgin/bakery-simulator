import { SAVE_VERSION } from './schema';

/** Turns the data of one save version into the next version's. */
export type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

/**
 * One migration for each old version, keyed by the version it reads. Version
 * 1 is the first format, so there are none yet. When the format changes:
 * raise SAVE_VERSION, add the step here, and add a test with a stored fixture
 * of the old format.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

/**
 * Brings saved data up to the current version, one step at a time. Gives
 * null when the data has no usable version, comes from a newer game, or a
 * step is missing or fails.
 */
export function migrate(
  data: unknown,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = SAVE_VERSION,
): Record<string, unknown> | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  let current = data as Record<string, unknown>;
  for (;;) {
    const { version } = current;
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return null;
    if (version === target) return current;
    const step = migrations[version];
    if (version > target || !step) return null;
    try {
      current = { ...step(current), version: version + 1 };
    } catch {
      return null;
    }
  }
}
