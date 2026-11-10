import type { CSSProperties } from 'react';
import type { Point } from '../../content/places';

/** Where something stands in the room. Things lower down are drawn in front. */
export function standAt({ x, y }: Point): CSSProperties {
  return { left: `${x}%`, top: `${y}%`, zIndex: Math.round(y) };
}

/** A point handed to the stylesheet, for walking in from it or out to it. */
export function pointVars(name: 'from' | 'to', { x, y }: Point): CSSProperties {
  return { [`--${name}-x`]: `${x}%`, [`--${name}-y`]: `${y}%` };
}
