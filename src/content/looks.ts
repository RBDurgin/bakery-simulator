import type { AssetId } from '../assets';

/** The looks the player can pick for their baker. */
export const BAKER_LOOKS = [
  'baker-1',
  'baker-2',
  'baker-3',
  'baker-4',
  'baker-5',
  'baker-6',
] as const satisfies readonly AssetId[];

export type BakerLook = (typeof BAKER_LOOKS)[number];

export const DEFAULT_BAKER_LOOK: BakerLook = 'baker-1';

export function isBakerLook(value: unknown): value is BakerLook {
  return (BAKER_LOOKS as readonly unknown[]).includes(value);
}

const CUSTOMER_LOOKS = [
  'customer-1',
  'customer-2',
  'customer-3',
  'customer-4',
  'customer-5',
  'customer-6',
  'customer-7',
  'customer-8',
] as const satisfies readonly AssetId[];

/**
 * The look of a customer. It depends only on the customer's number, so it
 * stays the same while they wait and needs nothing stored in the game.
 */
export function customerLook(customerId: number): AssetId {
  // Stepping by three mixes the looks, and neighbours in line never match.
  return CUSTOMER_LOOKS[(Math.abs(customerId) * 3) % CUSTOMER_LOOKS.length] as AssetId;
}

export const CUSTOMER_LOOK_COUNT = CUSTOMER_LOOKS.length;
