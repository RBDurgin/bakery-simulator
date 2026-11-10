import { useState, type FormEvent } from 'react';
import { BALANCE } from '../../content/balance';
import { text } from '../../content/text';
import { DEFAULT_BAKERY_NAME, DEFAULT_PLAYER_NAME } from '../../engine/state';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../components/Button';
import { GameIcon } from '../components/GameIcon';
import styles from './NewGameScreen.module.css';

/** The player names their bakery and their character, then the first morning starts. */
export function NewGameScreen() {
  const startNewGame = useGameStore((store) => store.startNewGame);
  const goTo = useGameStore((store) => store.goTo);
  const [bakeryName, setBakeryName] = useState(DEFAULT_BAKERY_NAME);
  const [playerName, setPlayerName] = useState(DEFAULT_PLAYER_NAME);
  const hint = text.newGame.nameHint(BALANCE.nameMaxLength);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    startNewGame({ bakeryName, playerName });
  };

  return (
    <form className={styles.form} onSubmit={submit} aria-labelledby="new-game-heading">
      <div className={styles.fields}>
        <h1 id="new-game-heading" className={styles.heading}>
          {text.newGame.heading}
        </h1>
        <p className={styles.intro}>{text.newGame.intro}</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="bakery-name">
            <GameIcon id="bakery" decorative /> {text.newGame.bakeryNameLabel}
          </label>
          <input
            id="bakery-name"
            className={styles.input}
            value={bakeryName}
            maxLength={BALANCE.nameMaxLength}
            autoComplete="off"
            aria-describedby="bakery-name-hint"
            data-testid="bakery-name-input"
            onChange={(event) => setBakeryName(event.target.value)}
          />
          <span id="bakery-name-hint" className={styles.hint}>
            {hint}
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="player-name">
            <GameIcon id="baker" decorative /> {text.newGame.playerNameLabel}
          </label>
          <input
            id="player-name"
            className={styles.input}
            value={playerName}
            maxLength={BALANCE.nameMaxLength}
            autoComplete="off"
            aria-describedby="player-name-hint"
            data-testid="player-name-input"
            onChange={(event) => setPlayerName(event.target.value)}
          />
          <span id="player-name-hint" className={styles.hint}>
            {hint}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="submit" data-testid="open-bakery-button">
          {text.newGame.submit}
        </Button>
        <Button variant="secondary" onClick={() => goTo('title')}>
          {text.newGame.back}
        </Button>
      </div>
    </form>
  );
}
