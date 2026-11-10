import type { Cents } from '../engine/money';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** What happens when the baker wakes up and cannot afford to bake anything. */
export type Rescue =
  /** A present that never has to be paid back. */
  | { kind: 'gift'; amount: Cents }
  /**
   * Money to pay back a little each evening. `fee` is added to what is owed.
   * `maxMissed` is how many missed repayments end the run; null means never.
   */
  | { kind: 'loan'; amount: Cents; fee: Cents; repayment: Cents; maxMissed: number | null };

export interface DifficultySettings {
  id: Difficulty;
  name: string;
  /** One short line for the new game form. */
  blurb: string;
  startingMoney: Cents;
  /** How long a customer waits before leaving, on the shop clock. */
  customerPatienceMs: number;
  /** How fast the shop clock runs while the shop is open. Walking is never sped up. */
  clockSpeed: number;
  /** How long a ready batch can stay in the oven before it burns, on the shop clock. */
  burnWindowMs: number;
  rescue: Rescue;
}

/**
 * Everything that differs between the difficulty modes. Tuning a mode means
 * changing a number here, never engine code. Rows of the plan's table that
 * belong to later features (price changes, bills, spoilage, hints) join this
 * table when those features are built.
 */
export const DIFFICULTIES: Record<Difficulty, DifficultySettings> = {
  easy: {
    id: 'easy',
    name: 'Easy',
    blurb: 'Lots of time and money. Grandma helps if you run out.',
    startingMoney: 10_000,
    customerPatienceMs: 120_000,
    clockSpeed: 0.75,
    burnWindowMs: 60_000,
    rescue: { kind: 'gift', amount: 2000 },
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    blurb: 'A fair challenge. The bank lends money if you run out.',
    startingMoney: 6000,
    customerPatienceMs: 60_000,
    clockSpeed: 1,
    burnWindowMs: 30_000,
    rescue: { kind: 'loan', amount: 2000, fee: 0, repayment: 500, maxMissed: null },
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    blurb: 'Less money and a fast clock. Loans cost extra.',
    startingMoney: 4000,
    customerPatienceMs: 40_000,
    clockSpeed: 1.25,
    burnWindowMs: 15_000,
    rescue: { kind: 'loan', amount: 2000, fee: 500, repayment: 500, maxMissed: 3 },
  },
};

export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as Difficulty[];

export const DEFAULT_DIFFICULTY: Difficulty = 'medium';

export function isDifficulty(value: unknown): value is Difficulty {
  return (DIFFICULTY_IDS as unknown[]).includes(value);
}
