import { RECIPES, RECIPE_IDS, type RecipeId } from '../../content/recipes';
import { text } from '../../content/text';
import { formatCents } from '../../engine/money';
import { profit, settingsFor, starsFor } from '../../engine/selectors';
import type { GameState } from '../../engine/state';
import { GameIcon } from '../components/GameIcon';
import { Stars } from '../components/Stars';
import { Panel } from './Panel';
import styles from './panels.module.css';
import type { PanelProps } from './shared';

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

/** What happened to the bank loan this evening. Shown only when there is, or was, a loan. */
function LoanCard({ game }: { game: GameState }) {
  const { repaid, missedRepayment } = game.today;
  if (game.loan.owed === 0 && repaid === 0) return null;
  const help = settingsFor(game).rescue;
  const maxMissed = help.kind === 'loan' ? help.maxMissed : null;
  const note = missedRepayment
    ? maxMissed === null
      ? text.evening.missed
      : text.evening.missedCount(game.loan.missed, maxMissed)
    : game.loan.owed === 0
      ? text.evening.loanDone
      : text.evening.loanExplained;

  return (
    <section
      className={styles.card}
      aria-labelledby="report-loan-heading"
      data-testid="report-loan"
    >
      <h3 id="report-loan-heading" className={styles.cardHeading}>
        <GameIcon id="bank" decorative /> {text.evening.loanHeading}
      </h3>
      <table className={styles.table}>
        <tbody>
          <tr>
            <th scope="row">{text.evening.repaid}</th>
            <td data-testid="report-repaid">{formatCents(repaid)}</td>
          </tr>
          <tr>
            <th scope="row">{text.evening.owed}</th>
            <td data-testid="report-owed">{formatCents(game.loan.owed)}</td>
          </tr>
        </tbody>
      </table>
      <p className={styles.note} data-testid="report-loan-note">
        {note}
      </p>
    </section>
  );
}

/** The evening report, opened by counting the till: a plain-words look at the day. */
export function ReportPanel({ game, dispatch }: PanelProps) {
  const { today } = game;
  const total = profit(game);
  const profitSentence =
    total > 0
      ? text.evening.profitUp(formatCents(total))
      : total < 0
        ? text.evening.profitDown(formatCents(-total))
        : text.evening.profitEven;

  return (
    <Panel
      title={text.evening.heading(game.day)}
      closeLabel={text.evening.done}
      onClose={() => dispatch({ type: 'closePanel' })}
      testId="report-panel"
    >
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

      <LoanCard game={game} />

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
    </Panel>
  );
}
