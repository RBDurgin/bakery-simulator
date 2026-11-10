import type { AssetId } from '../assets';
import type { IngredientId } from './ingredients';

/*
 * The places of the world. Each place is one room that fits the screen.
 * Positions are percentages of the room: x from the left, y from the top.
 * A position is where something stands, so it marks the bottom middle of a
 * thing or the feet of a character.
 */
export type PlaceId = 'home' | 'street' | 'market' | 'bakery';

export interface Point {
  x: number;
  y: number;
}

/** What the baker does on reaching a thing. The rules live in the engine. */
export type ThingJob =
  | { type: 'door'; place: PlaceId; spot: string }
  | { type: 'stall'; ingredientId: IngredientId }
  | { type: 'oven' }
  | { type: 'shelf' }
  | { type: 'counter' }
  | { type: 'till' }
  | { type: 'sign' }
  | { type: 'bed' };

/** Something the player can tap. The baker walks to its spot and does the job. */
export interface Thing extends Point {
  /** Unique within its place. */
  id: string;
  name: string;
  asset: AssetId;
  /** The spot where the baker stands to use it. */
  spot: string;
  job: ThingJob;
}

/** Something to look at that cannot be tapped. */
export interface Decor extends Point {
  asset: AssetId;
}

export interface Place {
  id: PlaceId;
  name: string;
  asset: AssetId;
  /** Where a character can stand. */
  spots: Record<string, Point>;
  /** Pairs of spots a character can walk between, in either direction. */
  paths: readonly (readonly [string, string])[];
  things: readonly Thing[];
  /** Townsfolk who work here. */
  people: readonly Decor[];
  decor: readonly Decor[];
  /** Where customers come in, and where they wait, first in line first. */
  entrance?: Point;
  queue?: readonly Point[];
}

export const PLACES: Record<PlaceId, Place> = {
  home: {
    id: 'home',
    name: 'Home',
    asset: 'home',
    spots: {
      bed: { x: 34, y: 74 },
      door: { x: 78, y: 74 },
    },
    paths: [['bed', 'door']],
    things: [
      { id: 'bed', name: 'Bed', asset: 'bed', x: 26, y: 56, spot: 'bed', job: { type: 'bed' } },
      {
        id: 'door',
        name: 'Street',
        asset: 'door',
        x: 80,
        y: 52,
        spot: 'door',
        job: { type: 'door', place: 'street', spot: 'home' },
      },
    ],
    people: [],
    decor: [
      { asset: 'window', x: 52, y: 26 },
      { asset: 'plant', x: 10, y: 92 },
    ],
  },

  street: {
    id: 'street',
    name: 'Street',
    asset: 'street',
    spots: {
      bakery: { x: 20, y: 60 },
      middle: { x: 50, y: 64 },
      home: { x: 80, y: 60 },
      market: { x: 50, y: 82 },
    },
    paths: [
      ['bakery', 'middle'],
      ['middle', 'home'],
      ['middle', 'market'],
    ],
    things: [
      {
        id: 'bakery',
        name: 'Bakery',
        asset: 'bakery',
        x: 20,
        y: 44,
        spot: 'bakery',
        job: { type: 'door', place: 'bakery', spot: 'door' },
      },
      {
        id: 'home',
        name: 'Home',
        asset: 'home',
        x: 80,
        y: 44,
        spot: 'home',
        job: { type: 'door', place: 'home', spot: 'door' },
      },
      {
        id: 'market',
        name: 'Market',
        asset: 'market',
        x: 50,
        y: 100,
        spot: 'market',
        job: { type: 'door', place: 'market', spot: 'exit' },
      },
    ],
    people: [],
    decor: [
      { asset: 'sun', x: 50, y: 16 },
      { asset: 'tree', x: 50, y: 42 },
      { asset: 'flower', x: 12, y: 92 },
      { asset: 'flower', x: 88, y: 92 },
    ],
  },

  market: {
    id: 'market',
    name: 'Market',
    asset: 'market',
    spots: {
      flour: { x: 30, y: 44 },
      sugar: { x: 80, y: 44 },
      butter: { x: 30, y: 80 },
      egg: { x: 80, y: 80 },
      exit: { x: 55, y: 86 },
    },
    paths: [
      ['flour', 'sugar'],
      ['flour', 'butter'],
      ['sugar', 'egg'],
      ['butter', 'exit'],
      ['egg', 'exit'],
    ],
    things: [
      {
        id: 'flour',
        name: 'Flour',
        asset: 'flour',
        x: 22,
        y: 30,
        spot: 'flour',
        job: { type: 'stall', ingredientId: 'flour' },
      },
      {
        id: 'sugar',
        name: 'Sugar',
        asset: 'sugar',
        x: 72,
        y: 30,
        spot: 'sugar',
        job: { type: 'stall', ingredientId: 'sugar' },
      },
      {
        id: 'butter',
        name: 'Butter',
        asset: 'butter',
        x: 22,
        y: 66,
        spot: 'butter',
        job: { type: 'stall', ingredientId: 'butter' },
      },
      {
        id: 'egg',
        name: 'Eggs',
        asset: 'egg',
        x: 72,
        y: 66,
        spot: 'egg',
        job: { type: 'stall', ingredientId: 'egg' },
      },
      {
        id: 'exit',
        name: 'Street',
        asset: 'street',
        x: 55,
        y: 100,
        spot: 'exit',
        job: { type: 'door', place: 'street', spot: 'market' },
      },
    ],
    people: [
      { asset: 'keeper-1', x: 44, y: 28 },
      { asset: 'keeper-2', x: 93, y: 28 },
      { asset: 'keeper-3', x: 44, y: 64 },
      { asset: 'keeper-4', x: 93, y: 64 },
    ],
    decor: [{ asset: 'tree', x: 50, y: 14 }],
  },

  bakery: {
    id: 'bakery',
    name: 'Bakery',
    asset: 'bakery',
    spots: {
      oven: { x: 18, y: 46 },
      shelf: { x: 44, y: 46 },
      counter: { x: 62, y: 46 },
      till: { x: 86, y: 46 },
      aisle: { x: 12, y: 62 },
      door: { x: 14, y: 80 },
    },
    paths: [
      ['oven', 'shelf'],
      ['shelf', 'counter'],
      ['counter', 'till'],
      ['oven', 'aisle'],
      ['aisle', 'door'],
    ],
    things: [
      {
        id: 'oven',
        name: 'Oven',
        asset: 'oven',
        x: 18,
        y: 30,
        spot: 'oven',
        job: { type: 'oven' },
      },
      {
        id: 'shelf',
        name: 'Shelf',
        asset: 'shelf',
        x: 48,
        y: 30,
        spot: 'shelf',
        job: { type: 'shelf' },
      },
      {
        id: 'counter',
        name: 'Counter',
        asset: 'counter',
        x: 62,
        y: 64,
        spot: 'counter',
        job: { type: 'counter' },
      },
      {
        id: 'till',
        name: 'Till',
        asset: 'till',
        x: 87,
        y: 64,
        spot: 'till',
        job: { type: 'till' },
      },
      {
        id: 'door',
        name: 'Street',
        asset: 'door',
        x: 11,
        y: 100,
        spot: 'door',
        job: { type: 'door', place: 'street', spot: 'bakery' },
      },
      {
        id: 'sign',
        name: 'Sign',
        asset: 'sign',
        x: 31,
        y: 100,
        spot: 'door',
        job: { type: 'sign' },
      },
    ],
    people: [],
    decor: [{ asset: 'window', x: 84, y: 24 }],
    entrance: { x: 14, y: 92 },
    queue: [
      { x: 46, y: 87 },
      { x: 61, y: 87 },
      { x: 76, y: 87 },
      { x: 91, y: 87 },
    ],
  },
};

export const PLACE_IDS = Object.keys(PLACES) as PlaceId[];

/** The position of a spot. Spot ids are checked by a content test. */
export function spotPoint(place: Place, spot: string): Point {
  return place.spots[spot] as Point;
}

/** A thing by id. Thing ids are checked by a content test. */
export function thingById(place: Place, id: string): Thing | undefined {
  return place.things.find((thing) => thing.id === id);
}

/** Where the baker starts each morning. */
export const WAKE_UP = { place: 'home', spot: 'bed' } as const;

/** Where the baker stands to serve a customer. */
export const SERVING = { place: 'bakery', spot: 'counter' } as const;
