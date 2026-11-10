/**
 * Tuning numbers for the core loop. Phase 2 turns these into the per-difficulty
 * table; until then the game uses this single set (the planned Medium values).
 * All times are in game milliseconds.
 */
export const BALANCE = {
  startingMoney: 6000,
  /** Length of the open phase. */
  dayLengthMs: 180_000,
  /** How long a ready batch can stay in the oven before it burns. */
  burnWindowMs: 30_000,
  /** How long a customer waits before leaving. */
  customerPatienceMs: 60_000,
  /** The first customer of the day arrives after this long. */
  firstCustomerDelayMs: 4_000,
  /** Later customers arrive after a random time in this range. */
  customerIntervalMinMs: 8_000,
  customerIntervalMaxMs: 14_000,
  /** Customers walk past when this many are already waiting. */
  maxWaitingCustomers: 4,
  /** Reputation is a score from 0 to 100, shown as one to five stars. */
  startingReputation: 50,
  reputationMax: 100,
  reputationPerHappyCustomer: 2,
  reputationPerLostCustomer: -3,
  /** Longest bakery or player name. */
  nameMaxLength: 20,
} as const;
