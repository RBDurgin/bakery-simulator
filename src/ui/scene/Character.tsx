import type { ReactNode } from 'react';
import type { AssetId } from '../../assets';
import type { Point } from '../../content/places';
import { GameIcon } from '../components/GameIcon';
import styles from './Scene.module.css';
import { standAt } from './standAt';

interface CharacterProps {
  look: AssetId;
  /** Where the character's feet are, in percent of the room. */
  at: Point;
  /** A walking character bounces, unless reduced motion is on. */
  walking?: boolean;
  /** Named characters are announced; the rest are decoration. */
  name?: string;
  testId?: string;
  children?: ReactNode;
}

/** A person in a place. Characters never take taps, so they cannot block a button. */
export function Character({ look, at, walking = false, name, testId, children }: CharacterProps) {
  const a11y = name ? { role: 'img' as const, 'aria-label': name } : { 'aria-hidden': true };
  return (
    <div
      className={`${styles.character} ${walking ? styles.walking : ''}`}
      style={standAt(at)}
      data-testid={testId}
      data-walking={walking}
      {...a11y}
    >
      {children}
      <span className={styles.body}>
        <GameIcon id={look} decorative size="large" />
      </span>
    </div>
  );
}
