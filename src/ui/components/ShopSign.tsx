import { text } from '../../content/text';
import { formatCents } from '../../engine/money';
import { starsFor } from '../../engine/selectors';
import type { GameState } from '../../engine/state';
import { GameIcon } from './GameIcon';
import styles from './ShopSign.module.css';
import { Stars } from './Stars';

/** The sign above every game screen: bakery name, day, money and stars. */
export function ShopSign({ game }: { game: GameState }) {
  return (
    <header className={styles.sign}>
      <h1 className={styles.name} data-testid="bakery-name">
        <GameIcon id="bakery" decorative /> {game.bakeryName}
      </h1>
      <div className={styles.facts}>
        <span data-testid="day">{text.sign.day(game.day)}</span>
        <span className={styles.money}>
          <GameIcon id="coin" decorative />
          <span className={styles.srOnly}>{text.sign.money}: </span>
          <span data-testid="money">{formatCents(game.money)}</span>
        </span>
        <Stars stars={starsFor(game.reputation)} />
      </div>
    </header>
  );
}
