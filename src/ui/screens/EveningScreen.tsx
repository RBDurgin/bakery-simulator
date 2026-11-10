import { RECIPES, RECIPE_IDS, type RecipeId } from '../../content/recipes';
import { text } from '../../content/text';
import type { Action } from '../../engine/game';
import { formatCents } from '../../engine/money';
import { profit, starsFor } from '../../engine/selectors';
import type { GameState } from '../../engine/state';
import { AppShell } from '../AppShell';
import { Button } from '../components/Button';
import { GameIcon } from '../components/GameIcon';
import { ShopSign } from '../components/ShopSign';
import { Stars } from '../components/Stars';
import styles from './game.module.css';

interface ScreenProps {
  game: GameState;
  dispatch: (action: Action) => void;
}

function ItemCounts({ counts, empty }: { counts: Record<RecipeId, number>; empty: string }) {
  const ids = RECIPE_IDS.filter((id) => counts[id] > 0);
  if (ids.length === 0) return <p className={styles.note}>{empty}</p>;
  return (
    <ul className={styles.list}>
      {ids.map((id) => (
        <li key={id} className={styles.row}>
          <GameIcon id={RECIPES[id].asset} decorative />
          <span className={styles.grow}>
            {counts[id]} {counts[id] === 1 ? RECIPES[id].name : RECIPES[id].plural}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Evening: no clock. A plain-words report of the day, then on to tomorrow. */
export function EveningScreen({ game, dispatch }: ScreenProps) {
  const { today } = game;
  const total = profit(game);
  const profitSentence =
    total > 0
      ? text.evening.profitUp(formatCents(total))
      : total < 0
        ? text.evening.profitDown(formatCents(-total))
        : text.evening.profitEven;

  return (
    <AppShell
      bottomBar={
        <div className={styles.bottom}>
          <Button onClick={() => dispatch({ type: 'nextDay' })} data-testid="next-day-button">
            {text.evening.nextDay(game.day + 1)}
          </Button>
        </div>
      }
    >
      <div className={styles.screen} data-testid="evening-screen">
        <ShopSign game={game} />
        <h2 className={styles.heading}>{text.evening.heading(game.day)}</h2>
        <p className={styles.intro} data-testid="report-for">
          {text.evening.reportFor(game.playerName, game.bakeryName)}
        </p>

        <section className={styles.card} aria-labelledby="report-money-heading">
          <h3 id="report-money-heading" className={styles.cardHeading}>
            <GameIcon id="coin" decorative /> {text.evening.moneyHeading}
          </h3>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th scope="row">{text.evening.income}</th>
                <td data-testid="report-income">{formatCents(today.income)}</td>
              </tr>
              <tr>
                <th scope="row">{text.evening.spent}</th>
                <td data-testid="report-spent">{formatCents(today.spent)}</td>
              </tr>
              <tr className={styles.total}>
                <th scope="row">{text.evening.profit}</th>
                <td data-testid="report-profit">{formatCents(total)}</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.detail}>{text.evening.profitExplained}</p>
          <p className={styles.note} data-testid="report-profit-sentence">
            {profitSentence}
          </p>
        </section>

        <section className={styles.card} aria-labelledby="report-sold-heading">
          <h3 id="report-sold-heading" className={styles.cardHeading}>
            {text.evening.soldHeading}
          </h3>
          <div data-testid="report-sold">
            <ItemCounts counts={today.sold} empty={text.evening.nothingSold} />
          </div>
        </section>

        <section className={styles.card} aria-labelledby="report-wasted-heading">
          <h3 id="report-wasted-heading" className={styles.cardHeading}>
            {text.evening.wastedHeading}
          </h3>
          <div data-testid="report-wasted">
            <ItemCounts counts={today.wasted} empty={text.evening.nothingWasted} />
          </div>
        </section>

        <section className={styles.card} aria-labelledby="report-customers-heading">
          <h3 id="report-customers-heading" className={styles.cardHeading}>
            <GameIcon id="customer" decorative /> {text.evening.customersHeading}
          </h3>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th scope="row">{text.evening.happyCustomers}</th>
                <td data-testid="report-happy">{today.happyCustomers}</td>
              </tr>
              <tr>
                <th scope="row">{text.evening.lostCustomers}</th>
                <td data-testid="report-lost">{today.lostCustomers}</td>
              </tr>
              <tr>
                <th scope="row">{text.evening.starsHeading}</th>
                <td>
                  <Stars stars={starsFor(game.reputation)} />
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
