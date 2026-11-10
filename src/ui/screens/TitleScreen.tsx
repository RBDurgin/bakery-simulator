import { useState } from 'react';
import { text } from '../../content/text';
import { GameIcon } from '../components/GameIcon';
import styles from './TitleScreen.module.css';

/** Placeholder title screen. The real new-game flow arrives in Phase 1.5. */
export function TitleScreen() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <section className={styles.title} aria-labelledby="game-title">
      <div className={styles.hero}>
        <GameIcon id="muffin" size="huge" decorative />
        <h1 id="game-title" className={styles.heading}>
          {text.gameTitle}
        </h1>
        <p className={styles.tagline}>{text.tagline}</p>
        <div className={styles.treats} aria-hidden="true">
          <GameIcon id="cookie" size="large" decorative />
          <GameIcon id="bread" size="large" decorative />
          <GameIcon id="coin" size="large" decorative />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          data-testid="start-button"
          onClick={() => setShowComingSoon(true)}
        >
          {text.startButton}
        </button>
        <p className={styles.notice} role="status" data-testid="coming-soon">
          {showComingSoon ? text.comingSoon : ''}
        </p>
      </div>
    </section>
  );
}
