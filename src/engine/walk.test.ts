import { describe, expect, it } from 'vitest';
import { BALANCE } from '../content/balance';
import { PLACES, type Place } from '../content/places';
import { at, newGame, tapThing } from '../test/fixtures';
import { tick } from './game';
import type { Baker, Target } from './state';
import { bakerPoint, edgeMs, findRoute, msToNextSpot, walkTo } from './walk';

const bakery = PLACES.bakery;
const goal: Target = { kind: 'thing', id: 'till' };
const standing = (spot: string): Baker => ({ place: 'bakery', spot, walk: null });

/** Two islands: a and b are joined, c stands alone. */
const islands: Place = {
  ...bakery,
  spots: { a: { x: 0, y: 0 }, b: { x: 30, y: 40 }, c: { x: 90, y: 90 } },
  paths: [['a', 'b']],
  things: [],
};

describe('edgeMs', () => {
  it('is the distance times the walking pace, the same in both directions', () => {
    expect(edgeMs(islands, 'a', 'b')).toBe(50 * BALANCE.walkMsPerUnit);
    expect(edgeMs(islands, 'b', 'a')).toBe(edgeMs(islands, 'a', 'b'));
  });

  it('is about half a second between stations next to each other', () => {
    expect(edgeMs(bakery, 'oven', 'shelf')).toBeGreaterThanOrEqual(300);
    expect(edgeMs(bakery, 'oven', 'shelf')).toBeLessThanOrEqual(700);
  });
});

describe('findRoute', () => {
  it('follows the paths and adds up the time', () => {
    const route = findRoute(bakery, 'oven', 'till');
    expect(route?.spots).toEqual(['shelf', 'counter', 'till']);
    expect(route?.ms).toBe(
      edgeMs(bakery, 'oven', 'shelf') +
        edgeMs(bakery, 'shelf', 'counter') +
        edgeMs(bakery, 'counter', 'till'),
    );
  });

  it('works in either direction', () => {
    expect(findRoute(bakery, 'till', 'door')?.spots).toEqual([
      'counter',
      'shelf',
      'oven',
      'aisle',
      'door',
    ]);
  });

  it('takes the quicker of two ways round', () => {
    const market = PLACES.market;
    expect(findRoute(market, 'sugar', 'exit')?.spots).toEqual(['egg', 'exit']);
    expect(findRoute(market, 'flour', 'exit')?.spots).toEqual(['butter', 'exit']);
  });

  it('is empty when already there', () => {
    expect(findRoute(bakery, 'oven', 'oven')).toEqual({ spots: [], ms: 0 });
  });

  it('is null when there is no way', () => {
    expect(findRoute(islands, 'a', 'c')).toBeNull();
    expect(findRoute(islands, 'c', 'a')).toBeNull();
  });
});

describe('walkTo', () => {
  it('starts a walk along the route', () => {
    const baker = walkTo(standing('oven'), 'till', goal);
    expect(baker).toEqual({
      place: 'bakery',
      spot: 'oven',
      walk: { to: 'shelf', elapsedMs: 0, then: ['counter', 'till'], goal },
    });
  });

  it('does not walk when already there', () => {
    const baker = standing('till');
    expect(walkTo(baker, 'till', goal)).toBe(baker);
  });

  it('carries on to the next spot when that is the quicker way', () => {
    const start = walkTo(standing('oven'), 'till', goal)!;
    const door: Target = { kind: 'thing', id: 'door' };
    // Most of the way to the shelf, then told to go to the counter.
    const nearShelf = { ...start, walk: { ...start.walk!, elapsedMs: 400 } };
    expect(walkTo(nearShelf, 'counter', door)).toEqual({
      place: 'bakery',
      spot: 'oven',
      walk: { to: 'shelf', elapsedMs: 400, then: ['counter'], goal: door },
    });
  });

  it('turns back when that is the quicker way', () => {
    const start = walkTo(standing('oven'), 'till', goal)!;
    const walking = { ...start, walk: { ...start.walk!, elapsedMs: 100 } };
    const door: Target = { kind: 'thing', id: 'door' };
    const edge = edgeMs(bakery, 'oven', 'shelf');
    expect(walkTo(walking, 'door', door)).toEqual({
      place: 'bakery',
      spot: 'shelf',
      walk: { to: 'oven', elapsedMs: edge - 100, then: ['aisle', 'door'], goal: door },
    });
  });

  it('turns back to the spot just left', () => {
    const start = walkTo(standing('oven'), 'shelf', goal)!;
    const walking = { ...start, walk: { ...start.walk!, elapsedMs: 100 } };
    const turned = walkTo(walking, 'oven', goal)!;
    expect(turned.spot).toBe('shelf');
    expect(turned.walk).toMatchObject({ to: 'oven', then: [] });
    expect(msToNextSpot(turned)).toBe(100);
  });
});

describe('bakerPoint and msToNextSpot', () => {
  it('a standing baker is on the spot and is not going anywhere', () => {
    expect(bakerPoint(standing('oven'))).toEqual(bakery.spots.oven);
    expect(msToNextSpot(standing('oven'))).toBe(Infinity);
  });

  it('a walking baker is part of the way along', () => {
    const start = walkTo(standing('oven'), 'shelf', goal)!;
    const edge = edgeMs(bakery, 'oven', 'shelf');
    const half = { ...start, walk: { ...start.walk!, elapsedMs: edge / 2 } };
    expect(bakerPoint(half)).toEqual({ x: (18 + 44) / 2, y: 46 });
    expect(msToNextSpot(half)).toBe(edge / 2);
  });
});

describe('walking in the game', () => {
  it('takes the same path in one big tick or many small ones', () => {
    const start = tapThing(newGame(at('bakery', 'door')), 'till');
    const big = tick(start, 10_000);
    let small = start;
    for (let i = 0; i < 1000; i++) small = tick(small, 10);
    expect(small).toEqual(big);
    expect(big.baker).toEqual({ place: 'bakery', spot: 'till', walk: null });
  });

  it('takes as long as the route says', () => {
    const start = tapThing(newGame(at('bakery', 'oven')), 'till');
    const ms = findRoute(bakery, 'oven', 'till')!.ms;
    expect(tick(start, ms - 1).baker.walk).not.toBeNull();
    expect(tick(start, ms).baker).toEqual({ place: 'bakery', spot: 'till', walk: null });
  });
});
