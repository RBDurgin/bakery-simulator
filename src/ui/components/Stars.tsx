import { text } from '../../content/text';
import styles from './Stars.module.css';

/** Reputation as filled and empty stars, with words for screen readers. */
export function Stars({ stars }: { stars: number }) {
  return (
    <span
      className={styles.stars}
      role="img"
      aria-label={text.sign.stars(stars)}
      data-testid="stars"
    >
      {'★'.repeat(stars)}
      <span className={styles.empty}>{'☆'.repeat(5 - stars)}</span>
    </span>
  );
}
