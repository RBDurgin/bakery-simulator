/**
 * Money is always stored as a whole number of cents, so sums never pick up
 * floating point errors. Convert to dollars only for display.
 */
export type Cents = number;

/** Formats whole cents as dollars, for example 1250 → "$12.50" and -75 → "-$0.75". */
export function formatCents(cents: Cents): string {
  if (!Number.isInteger(cents)) {
    throw new RangeError(`Money must be whole cents, got ${cents}`);
  }
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const wholeDollars = Math.floor(abs / 100).toLocaleString('en-US');
  const rest = String(abs % 100).padStart(2, '0');
  return `${sign}$${wholeDollars}.${rest}`;
}

/** Converts a dollar amount to whole cents. */
export function dollars(amount: number): Cents {
  return Math.round(amount * 100);
}
