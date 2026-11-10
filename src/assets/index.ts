/**
 * The asset layer. Game code asks for an asset by id and never hard-codes an
 * emoji or image path, so real art can replace emoji later without touching
 * screens or components.
 */
export type AssetId =
  'bakery' | 'baker' | 'cookie' | 'muffin' | 'bread' | 'oven' | 'coin' | 'star' | 'customer';

export type Asset =
  { kind: 'emoji'; emoji: string; label: string } | { kind: 'image'; src: string; label: string };

const ASSETS: Record<AssetId, Asset> = {
  bakery: { kind: 'emoji', emoji: '🏪', label: 'Bakery' },
  baker: { kind: 'emoji', emoji: '🧑‍🍳', label: 'Baker' },
  cookie: { kind: 'emoji', emoji: '🍪', label: 'Cookie' },
  muffin: { kind: 'emoji', emoji: '🧁', label: 'Muffin' },
  bread: { kind: 'emoji', emoji: '🍞', label: 'Bread' },
  oven: { kind: 'emoji', emoji: '🔥', label: 'Oven' },
  coin: { kind: 'emoji', emoji: '🪙', label: 'Money' },
  star: { kind: 'emoji', emoji: '⭐', label: 'Star' },
  customer: { kind: 'emoji', emoji: '🙂', label: 'Customer' },
};

export function getAsset(id: AssetId): Asset {
  return ASSETS[id];
}

export const ASSET_IDS = Object.keys(ASSETS) as AssetId[];
