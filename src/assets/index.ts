/**
 * The asset layer. Game code asks for an asset by id and never hard-codes an
 * emoji or image path, so real art can replace emoji later without touching
 * screens or components. Items, places, things in a place and characters all
 * come from here.
 */
export type AssetId =
  | 'bakery'
  | 'baker'
  | 'cookie'
  | 'muffin'
  | 'bread'
  | 'flour'
  | 'sugar'
  | 'butter'
  | 'egg'
  | 'oven'
  | 'coin'
  | 'star'
  | 'customer'
  | 'clock'
  | 'shelf'
  | 'settings'
  | 'gift'
  | 'bank'
  | 'easy'
  | 'medium'
  | 'hard'
  // Places and the things in them.
  | 'home'
  | 'street'
  | 'market'
  | 'door'
  | 'sign'
  | 'counter'
  | 'till'
  | 'bed'
  | 'morning'
  | 'evening'
  // Things to look at.
  | 'window'
  | 'plant'
  | 'sun'
  | 'tree'
  | 'flower'
  // Characters.
  | 'baker-1'
  | 'baker-2'
  | 'baker-3'
  | 'baker-4'
  | 'baker-5'
  | 'baker-6'
  | 'customer-1'
  | 'customer-2'
  | 'customer-3'
  | 'customer-4'
  | 'customer-5'
  | 'customer-6'
  | 'customer-7'
  | 'customer-8'
  | 'keeper-1'
  | 'keeper-2'
  | 'keeper-3'
  | 'keeper-4'
  | 'happy'
  | 'grumpy';

export type Asset =
  { kind: 'emoji'; emoji: string; label: string } | { kind: 'image'; src: string; label: string };

const ASSETS: Record<AssetId, Asset> = {
  bakery: { kind: 'emoji', emoji: '🏪', label: 'Bakery' },
  baker: { kind: 'emoji', emoji: '🧑‍🍳', label: 'Baker' },
  cookie: { kind: 'emoji', emoji: '🍪', label: 'Cookie' },
  muffin: { kind: 'emoji', emoji: '🧁', label: 'Muffin' },
  bread: { kind: 'emoji', emoji: '🍞', label: 'Bread' },
  flour: { kind: 'emoji', emoji: '🌾', label: 'Flour' },
  sugar: { kind: 'emoji', emoji: '🍬', label: 'Sugar' },
  butter: { kind: 'emoji', emoji: '🧈', label: 'Butter' },
  egg: { kind: 'emoji', emoji: '🥚', label: 'Egg' },
  oven: { kind: 'emoji', emoji: '🔥', label: 'Oven' },
  coin: { kind: 'emoji', emoji: '🪙', label: 'Money' },
  star: { kind: 'emoji', emoji: '⭐', label: 'Star' },
  customer: { kind: 'emoji', emoji: '🙂', label: 'Customer' },
  clock: { kind: 'emoji', emoji: '⏰', label: 'Clock' },
  shelf: { kind: 'emoji', emoji: '🧺', label: 'Shelf' },
  settings: { kind: 'emoji', emoji: '⚙️', label: 'Settings' },
  gift: { kind: 'emoji', emoji: '🎁', label: 'Gift' },
  bank: { kind: 'emoji', emoji: '🏦', label: 'Bank' },
  easy: { kind: 'emoji', emoji: '🌱', label: 'Easy' },
  medium: { kind: 'emoji', emoji: '🌿', label: 'Medium' },
  hard: { kind: 'emoji', emoji: '🌶️', label: 'Hard' },

  home: { kind: 'emoji', emoji: '🏠', label: 'Home' },
  street: { kind: 'emoji', emoji: '🛣️', label: 'Street' },
  market: { kind: 'emoji', emoji: '⛺', label: 'Market' },
  door: { kind: 'emoji', emoji: '🚪', label: 'Door' },
  sign: { kind: 'emoji', emoji: '🪧', label: 'Sign' },
  counter: { kind: 'emoji', emoji: '🛎️', label: 'Counter' },
  till: { kind: 'emoji', emoji: '💰', label: 'Till' },
  bed: { kind: 'emoji', emoji: '🛏️', label: 'Bed' },
  morning: { kind: 'emoji', emoji: '🌤️', label: 'Morning' },
  evening: { kind: 'emoji', emoji: '🌙', label: 'Evening' },

  window: { kind: 'emoji', emoji: '🪟', label: 'Window' },
  plant: { kind: 'emoji', emoji: '🪴', label: 'Plant' },
  sun: { kind: 'emoji', emoji: '☀️', label: 'Sun' },
  tree: { kind: 'emoji', emoji: '🌳', label: 'Tree' },
  flower: { kind: 'emoji', emoji: '🌷', label: 'Flower' },

  'baker-1': { kind: 'emoji', emoji: '🧑‍🍳', label: 'Baker look 1' },
  'baker-2': { kind: 'emoji', emoji: '👩🏽‍🍳', label: 'Baker look 2' },
  'baker-3': { kind: 'emoji', emoji: '👨🏿‍🍳', label: 'Baker look 3' },
  'baker-4': { kind: 'emoji', emoji: '👩🏻‍🍳', label: 'Baker look 4' },
  'baker-5': { kind: 'emoji', emoji: '👨🏼‍🍳', label: 'Baker look 5' },
  'baker-6': { kind: 'emoji', emoji: '🧑🏾‍🍳', label: 'Baker look 6' },
  'customer-1': { kind: 'emoji', emoji: '👧', label: 'Customer' },
  'customer-2': { kind: 'emoji', emoji: '👦🏾', label: 'Customer' },
  'customer-3': { kind: 'emoji', emoji: '👩🏿', label: 'Customer' },
  'customer-4': { kind: 'emoji', emoji: '👨🏻', label: 'Customer' },
  'customer-5': { kind: 'emoji', emoji: '👵🏽', label: 'Customer' },
  'customer-6': { kind: 'emoji', emoji: '👴🏼', label: 'Customer' },
  'customer-7': { kind: 'emoji', emoji: '🧑🏽', label: 'Customer' },
  'customer-8': { kind: 'emoji', emoji: '🧒🏻', label: 'Customer' },
  'keeper-1': { kind: 'emoji', emoji: '🧑‍🌾', label: 'Stall keeper' },
  'keeper-2': { kind: 'emoji', emoji: '👩🏾‍🌾', label: 'Stall keeper' },
  'keeper-3': { kind: 'emoji', emoji: '👨🏽‍🌾', label: 'Stall keeper' },
  'keeper-4': { kind: 'emoji', emoji: '👩🏻‍🌾', label: 'Stall keeper' },
  happy: { kind: 'emoji', emoji: '💛', label: 'Happy' },
  grumpy: { kind: 'emoji', emoji: '💢', label: 'Grumpy' },
};

export function getAsset(id: AssetId): Asset {
  return ASSETS[id];
}

export const ASSET_IDS = Object.keys(ASSETS) as AssetId[];
