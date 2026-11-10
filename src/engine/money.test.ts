import { describe, expect, it } from 'vitest';
import { dollars, formatCents } from './money';

describe('formatCents', () => {
  it.each([
    [0, '$0.00'],
    [5, '$0.05'],
    [1250, '$12.50'],
    [10000, '$100.00'],
    [123456789, '$1,234,567.89'],
    [-75, '-$0.75'],
  ])('formats %i cents as %s', (cents, expected) => {
    expect(formatCents(cents)).toBe(expected);
  });

  it('rejects fractions of a cent', () => {
    expect(() => formatCents(1.5)).toThrow(RangeError);
  });
});

describe('dollars', () => {
  it('converts dollars to whole cents', () => {
    expect(dollars(100)).toBe(10000);
    expect(dollars(0.1 + 0.2)).toBe(30);
  });
});
