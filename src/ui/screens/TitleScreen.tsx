import { text } from '../../content/text';
import { useGameStore } from '../../store/gameStore';
import { GameIcon } from '../components/GameIcon';
import styles from './TitleScreen.module.css';

/** The first screen. Start leads to the new game form. */
export function TitleScreen() {
  const goTo = useGameStore((store) => store.goTo);

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
          onClick={() => goTo('newGame')}
        >
          {text.startButton}
        </button>
      </div>
    </section>
  );
}
