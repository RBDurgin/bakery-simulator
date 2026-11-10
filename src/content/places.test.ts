import { describe, expect, it } from 'vitest';
import { ASSET_IDS } from '../assets';
import { findRoute } from '../engine/walk';
import { INGREDIENT_IDS } from './ingredients';
import { BAKER_LOOKS, CUSTOMER_LOOK_COUNT, customerLook, isBakerLook } from './looks';
import { BALANCE } from './balance';
import { PLACES, PLACE_IDS, SERVING, WAKE_UP, thingById } from './places';

const places = PLACE_IDS.map((id) => PLACES[id]);
const inRoom = ({ x, y }: { x: number; y: number }) => x >= 0 && x <= 100 && y >= 0 && y <= 100;

describe.each(places)('the $id place', (place) => {
  const spots = Object.keys(place.spots);

  it('has a name, an icon and its own id', () => {
    expect(PLACES[place.id]).toBe(place);
    expect(place.name.trim()).not.toBe('');
    expect(ASSET_IDS).toContain(place.asset);
  });

  it('keeps every spot, thing, person and decoration inside the room', () => {
    const points = [
      ...Object.values(place.spots),
      ...place.things,
      ...place.people,
      ...place.decor,
      ...(place.queue ?? []),
      ...(place.entrance ? [place.entrance] : []),
    ];
    for (const point of points) expect(inRoom(point), JSON.stringify(point)).toBe(true);
  });

  it('has paths only between real, different spots', () => {
    for (const [a, b] of place.paths) {
      expect(spots).toContain(a);
      expect(spots).toContain(b);
      expect(a).not.toBe(b);
    }
  });

  it('lets the baker walk from every spot to every other spot', () => {
    for (const from of spots) {
      for (const to of spots) {
        expect(findRoute(place, from, to), `${from} to ${to}`).not.toBeNull();
      }
    }
  });

  it('gives every thing a unique id, a name, an icon and a real spot', () => {
    const ids = place.things.map((thing) => thing.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const thing of place.things) {
      expect(thing.name.trim()).not.toBe('');
      expect(ASSET_IDS).toContain(thing.asset);
      expect(spots).toContain(thing.spot);
      expect(thingById(place, thing.id)).toBe(thing);
    }
  });

  it('uses real icons for people and decorations', () => {
    for (const { asset } of [...place.people, ...place.decor]) expect(ASSET_IDS).toContain(asset);
  });

  it('has doors that lead to a real spot in another place, with a way back', () => {
    for (const thing of place.things) {
      if (thing.job.type !== 'door') continue;
      const { place: otherId, spot } = thing.job;
      expect(otherId).not.toBe(place.id);
      const other = PLACES[otherId];
      expect(Object.keys(other.spots)).toContain(spot);
      const back = other.things.some(
        (t) => t.job.type === 'door' && t.job.place === place.id && t.spot === spot,
      );
      expect(back, `no door back from ${otherId}`).toBe(true);
    }
  });
});

describe('the world', () => {
  it('can be walked from home to every place', () => {
    const reached = new Set<string>([WAKE_UP.place]);
    for (let i = 0; i < PLACE_IDS.length; i++) {
      for (const id of [...reached]) {
        for (const thing of PLACES[id as keyof typeof PLACES].things) {
          if (thing.job.type === 'door') reached.add(thing.job.place);
        }
      }
    }
    expect([...reached].sort()).toEqual([...PLACE_IDS].sort());
  });

  it('has a stall for each ingredient, all in the market', () => {
    const stalls = PLACES.market.things.flatMap((t) =>
      t.job.type === 'stall' ? [t.job.ingredientId] : [],
    );
    expect(stalls.sort()).toEqual([...INGREDIENT_IDS].sort());
    for (const place of places) {
      if (place.id === 'market') continue;
      expect(place.things.some((t) => t.job.type === 'stall')).toBe(false);
    }
  });

  it('has each job the day needs, in the right place', () => {
    const jobs = (id: keyof typeof PLACES) => PLACES[id].things.map((t) => t.job.type);
    expect(jobs('bakery')).toEqual(
      expect.arrayContaining(['oven', 'shelf', 'counter', 'till', 'sign', 'door']),
    );
    expect(jobs('home')).toContain('bed');
    expect(Object.keys(PLACES[WAKE_UP.place].spots)).toContain(WAKE_UP.spot);
    expect(thingById(PLACES[SERVING.place], 'counter')?.spot).toBe(SERVING.spot);
  });

  it('has a place in the queue for every waiting customer', () => {
    expect(PLACES.bakery.queue).toHaveLength(BALANCE.maxWaitingCustomers);
    expect(PLACES.bakery.entrance).toBeDefined();
  });
});

describe('looks', () => {
  it('offers baker looks that are real icons', () => {
    for (const look of BAKER_LOOKS) expect(ASSET_IDS).toContain(look);
    expect(isBakerLook('baker-2')).toBe(true);
    expect(isBakerLook('customer-1')).toBe(false);
    expect(isBakerLook(undefined)).toBe(false);
  });

  it('gives each customer a look that is a real icon and never changes', () => {
    const looks = new Set<string>();
    for (let id = 1; id <= 200; id++) {
      const look = customerLook(id);
      expect(ASSET_IDS).toContain(look);
      expect(customerLook(id)).toBe(look);
      looks.add(look);
    }
    expect(looks.size).toBe(CUSTOMER_LOOK_COUNT);
  });

  it('makes customers next to each other in line look different', () => {
    for (let id = 1; id <= 50; id++) expect(customerLook(id)).not.toBe(customerLook(id + 1));
  });
});
