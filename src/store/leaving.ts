import type { GameState } from '../engine/state';

/**
 * A customer who has just left the queue. The engine forgets customers the
 * moment they go; the scene keeps these for a moment to show them walking
 * out, happy or grumpy. This is decoration only and never changes the game.
 */
export interface Leaving {
  id: number;
  /** Their place in the queue when they left. */
  queueIndex: number;
  mood: 'happy' | 'grumpy' | 'calm';
}

/** At most this many are remembered; older ones have long since walked out. */
export const MAX_LEAVING = 4;

export function leavingAfter(before: GameState, after: GameState, leaving: Leaving[]): Leaving[] {
  const still = new Set(after.customers.map((c) => c.id));
  const gone = before.customers.flatMap((c, queueIndex) =>
    still.has(c.id) ? [] : [{ id: c.id, queueIndex }],
  );
  if (gone.length === 0) return leaving;
  // A sale and a customer giving up never happen in the same step.
  const mood =
    after.phase !== 'open'
      ? 'calm'
      : after.today.happyCustomers > before.today.happyCustomers
        ? 'happy'
        : 'grumpy';
  return [...leaving, ...gone.map((g) => ({ ...g, mood }) as const)].slice(-MAX_LEAVING);
}
