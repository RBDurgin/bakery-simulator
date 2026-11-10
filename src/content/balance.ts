/**
 * Tuning numbers that are the same on every difficulty. The numbers that
 * differ between modes live in `difficulty.ts`. Times are in milliseconds on
 * the shop clock, apart from walking, which is never sped up.
 */
export const BALANCE = {
  /** Length of the open phase. */
  dayLengthMs: 180_000,
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
  /**
   * Walking time for each unit of distance. A room is 100 units wide, so a
   * walk between stations next to each other takes about half a second.
   */
  walkMsPerUnit: 20,
  /** Longest bakery or player name. */
  nameMaxLength: 20,
} as const;
