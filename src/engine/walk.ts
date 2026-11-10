import { BALANCE } from '../content/balance';
import { PLACES, spotPoint, type Place, type Point } from '../content/places';
import type { Baker, Target } from './state';

/** How long the walk between two spots takes. */
export function edgeMs(place: Place, from: string, to: string): number {
  const a = spotPoint(place, from);
  const b = spotPoint(place, to);
  return Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) * BALANCE.walkMsPerUnit));
}

export interface Route {
  /** The spots to walk through after the starting spot, ending at the destination. */
  spots: string[];
  ms: number;
}

/** The quickest way along the paths from one spot to another, or null if there is none. */
export function findRoute(place: Place, from: string, to: string): Route | null {
  const best = new Map<string, { ms: number; via: string | null }>([[from, { ms: 0, via: null }]]);
  const todo = new Set(Object.keys(place.spots));
  while (todo.size > 0) {
    let nearest: string | null = null;
    for (const spot of todo) {
      const reached = best.get(spot);
      if (reached && (nearest === null || reached.ms < best.get(nearest)!.ms)) nearest = spot;
    }
    if (nearest === null || nearest === to) break;
    todo.delete(nearest);
    const soFar = best.get(nearest)!.ms;
    for (const [a, b] of place.paths) {
      const next = a === nearest ? b : b === nearest ? a : null;
      if (next === null || !todo.has(next)) continue;
      const ms = soFar + edgeMs(place, nearest, next);
      if (ms < (best.get(next)?.ms ?? Infinity)) best.set(next, { ms, via: nearest });
    }
  }

  const end = best.get(to);
  if (!end) return null;
  const spots: string[] = [];
  for (let spot = to; spot !== from; spot = best.get(spot)!.via!) spots.unshift(spot);
  return { spots, ms: end.ms };
}

/**
 * Sends the baker towards a spot. A baker who is already walking carries on
 * to the next spot or turns back, whichever gets there sooner. A baker who
 * already stands on the spot comes back with no walk. The result is null
 * when there is no way to the spot.
 */
export function walkTo(baker: Baker, spot: string, goal: Target): Baker | null {
  const place = PLACES[baker.place];
  if (!baker.walk) {
    const route = findRoute(place, baker.spot, spot);
    if (!route) return null;
    const [to, ...then] = route.spots;
    return to === undefined ? baker : { ...baker, walk: { to, elapsedMs: 0, then, goal } };
  }

  const { to, elapsedMs } = baker.walk;
  const onward = findRoute(place, to, spot);
  const back = findRoute(place, baker.spot, spot);
  if (!onward || !back) return null;
  const leftMs = edgeMs(place, baker.spot, to) - elapsedMs;
  if (back.ms + elapsedMs < onward.ms + leftMs) {
    return {
      ...baker,
      spot: to,
      walk: { to: baker.spot, elapsedMs: leftMs, then: back.spots, goal },
    };
  }
  return { ...baker, walk: { to, elapsedMs, then: onward.spots, goal } };
}

/** Time until a walking baker reaches the next spot. */
export function msToNextSpot(baker: Baker): number {
  if (!baker.walk) return Infinity;
  return Math.max(0, edgeMs(PLACES[baker.place], baker.spot, baker.walk.to) - baker.walk.elapsedMs);
}

/** Where the baker is right now, part of the way along a walk or standing on a spot. */
export function bakerPoint(baker: Baker): Point {
  const place = PLACES[baker.place];
  const from = spotPoint(place, baker.spot);
  if (!baker.walk) return from;
  const to = spotPoint(place, baker.walk.to);
  const part = Math.min(1, baker.walk.elapsedMs / edgeMs(place, baker.spot, baker.walk.to));
  return { x: from.x + (to.x - from.x) * part, y: from.y + (to.y - from.y) * part };
}
