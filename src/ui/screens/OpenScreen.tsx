import { BALANCE } from '../../content/balance';
import { RECIPES, RECIPE_IDS } from '../../content/recipes';
import { text } from '../../content/text';
import type { Action } from '../../engine/game';
import { batchesPossible, ovenStage, timeLeftMs } from '../../engine/selectors';
import type { GameState } from '../../engine/state';
import { AppShell } from '../AppShell';
import { Button } from '../components/Button';
import { GameIcon } from '../components/GameIcon';
import { PauseDialog } from '../components/PauseDialog';
import { ShopSign } from '../components/ShopSign';
import styles from './game.module.css';

interface ScreenProps {
  game: GameState;
  dispatch: (action: Action) => void;
}

/** Shows milliseconds as minutes and seconds, for example 2:05. */
function formatClock(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function Oven({ game, dispatch }: ScreenProps) {
  const stage = ovenStage(game.oven);
  if (game.oven.status === 'empty') {
    return (
      <>
        <p className={styles.note}>{text.open.ovenEmpty}</p>
        <div className={styles.actions}>
          {RECIPE_IDS.map((id) => (
            <Button
              key={id}
              size="small"
              variant="secondary"
              disabled={batchesPossible(game, id) < 1}
              data-testid={`bake-${id}`}
              onClick={() => dispatch({ type: 'startBaking', recipeId: id })}
            >
              <GameIcon id={RECIPES[id].asset} decorative /> {text.open.bake(RECIPES[id].plural)}
            </Button>
          ))}
        </div>
      </>
    );
  }

  const recipe = RECIPES[game.oven.recipeId];
  if (stage === 'baking') {
    return (
      <>
        <p className={styles.note}>
          <GameIcon id={recipe.asset} decorative /> {text.open.baking(recipe.plural)}
        </p>
        <progress
          className={styles.bar}
          aria-label={text.open.bakeProgress}
          max={recipe.bakeMs}
          value={game.oven.elapsedMs}
        />
      </>
    );
  }
  return (
    <>
      <p className={styles.note} data-testid="oven-message">
        <GameIcon id={recipe.asset} decorative />{' '}
        {stage === 'ready' ? text.open.ready(recipe.plural) : text.open.burnt(recipe.plural)}
      </p>
      <div className={styles.actions}>
        <Button onClick={() => dispatch({ type: 'takeOut' })} data-testid="take-out-button">
          {stage === 'ready' ? text.open.takeOut : text.open.clearOven}
        </Button>
      </div>
    </>
  );
}

/** Open: a gentle clock runs. Bake, take goods out, and serve customers. */
export function OpenScreen({ game, dispatch }: ScreenProps) {
  const timeLeft = timeLeftMs(game);

  return (
    <AppShell
      bottomBar={
        <div className={styles.bottom}>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: 'pause' })}
            data-testid="pause-button"
          >
            {text.open.pause}
          </Button>
        </div>
      }
    >
      <div className={styles.screen} data-testid="open-screen">
        <ShopSign game={game} />
        <h2 className={styles.heading}>{text.open.heading}</h2>

        <div>
          <p className={styles.note}>
            <GameIcon id="clock" decorative />{' '}
            <span data-testid="time-left">{text.open.closesIn(formatClock(timeLeft))}</span>
          </p>
          <progress
            className={styles.bar}
            aria-label={text.open.clockLabel}
            max={BALANCE.dayLengthMs}
            value={timeLeft}
          />
        </div>

        <section className={styles.card} aria-labelledby="oven-heading" data-testid="oven">
          <h3 id="oven-heading" className={styles.cardHeading}>
            <GameIcon id="oven" decorative /> {text.open.ovenHeading}
          </h3>
          <Oven game={game} dispatch={dispatch} />
        </section>

        <section className={styles.card} aria-labelledby="shelf-heading">
          <h3 id="shelf-heading" className={styles.cardHeading}>
            <GameIcon id="shelf" decorative /> {text.open.shelfHeading}
          </h3>
          <ul className={`${styles.list} ${styles.shelf}`}>
            {RECIPE_IDS.map((id) => (
              <li key={id} className={styles.shelfItem}>
                <GameIcon id={RECIPES[id].asset} decorative size="large" />
                <span>{RECIPES[id].plural}</span>
                <span data-testid={`shelf-${id}`}>{game.shelf[id]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="customers-heading">
          <h3 id="customers-heading" className={styles.cardHeading}>
            <GameIcon id="customer" decorative /> {text.open.customersHeading}
          </h3>
          {game.customers.length === 0 ? (
            <p className={styles.note}>{text.open.noCustomers}</p>
          ) : (
            <ul className={styles.list} data-testid="customers">
              {game.customers.map((customer) => {
                const recipe = RECIPES[customer.wants];
                return (
                  <li key={customer.id} className={styles.row} data-testid="customer">
                    <GameIcon id={recipe.asset} decorative size="large" />
                    <span className={styles.grow}>
                      <span className={styles.name}>{text.open.wants(recipe.name)}</span>
                      <progress
                        className={styles.bar}
                        aria-label={text.open.patience}
                        max={BALANCE.customerPatienceMs}
                        value={BALANCE.customerPatienceMs - customer.waitedMs}
                      />
                    </span>
                    <Button
                      size="small"
                      disabled={game.shelf[customer.wants] < 1}
                      aria-label={text.open.serveLabel(recipe.name)}
                      data-testid={`serve-${customer.wants}`}
                      onClick={() => dispatch({ type: 'serveCustomer', customerId: customer.id })}
                    >
                      {text.open.serve}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {game.paused ? (
        <PauseDialog
          onResume={() => dispatch({ type: 'resume' })}
          onCloseShop={() => dispatch({ type: 'closeShop' })}
        />
      ) : null}
    </AppShell>
  );
}
