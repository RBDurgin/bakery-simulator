import { useState } from 'react';
import { text } from '../../content/text';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../components/Button';
import { GameIcon } from '../components/GameIcon';
import { SettingsPanel } from '../panels/SettingsPanel';
import styles from './TitleScreen.module.css';

/** The first screen. Start leads to the save slots. */
export function TitleScreen() {
  const goTo = useGameStore((store) => store.goTo);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          onClick={() => goTo('slots')}
        >
          {text.startButton}
        </button>
        <Button
          variant="secondary"
          onClick={() => setSettingsOpen(true)}
          data-testid="title-settings-button"
        >
          <GameIcon id="settings" decorative /> {text.settingsButton}
        </Button>
      </div>

      {settingsOpen ? <SettingsPanel onClose={() => setSettingsOpen(false)} /> : null}
    </section>
  );
}
