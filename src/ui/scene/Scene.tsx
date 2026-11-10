import { Fragment } from 'react';
import { INGREDIENTS } from '../../content/ingredients';
import { customerLook } from '../../content/looks';
import { PLACES, type Place, type Point, type Thing } from '../../content/places';
import { RECIPES, RECIPE_IDS } from '../../content/recipes';
import { text } from '../../content/text';
import type { Action } from '../../engine/game';
import { formatCents } from '../../engine/money';
import { bakerPoint, ovenStage, settingsFor } from '../../engine/selectors';
import type { GameState } from '../../engine/state';
import type { Leaving } from '../../store/leaving';
import { GameIcon } from '../components/GameIcon';
import { Character } from './Character';
import styles from './Scene.module.css';
import { pointVars, standAt } from './standAt';

interface SceneProps {
  game: GameState;
  dispatch: (action: Action) => void;
  /** Customers who have just left, shown walking out. */
  leaving?: readonly Leaving[];
}

/** The small line under a thing's name that shows what is going on there. */
function ThingStatus({ thing, game }: { thing: Thing; game: GameState }) {
  switch (thing.job.type) {
    case 'stall':
      return (
        <span className={styles.status}>
          {text.things.price(formatCents(INGREDIENTS[thing.job.ingredientId].price))}
        </span>
      );
    case 'sign':
      return (
        <span className={styles.status} data-testid="sign-status">
          {game.phase === 'open' ? text.things.signOpen : text.things.signClosed}
        </span>
      );
    case 'shelf':
      return (
        <span className={styles.counts}>
          {RECIPE_IDS.map((id) => (
            <Fragment key={id}>
              <span className={styles.count}>
                <GameIcon id={RECIPES[id].asset} decorative size="small" />
                <span className={styles.srOnly}>{RECIPES[id].plural}:</span>{' '}
                <span data-testid={`shelf-${id}`}>{game.shelf[id]}</span>
              </span>{' '}
            </Fragment>
          ))}
        </span>
      );
    case 'oven': {
      const stage = ovenStage(game);
      if (game.oven.status === 'empty') {
        return (
          <span className={styles.status} data-testid="oven-status" data-stage={stage}>
            {text.things.ovenEmpty}
          </span>
        );
      }
      const recipe = RECIPES[game.oven.recipeId];
      const words =
        stage === 'baking'
          ? text.things.ovenBaking(recipe.plural)
          : stage === 'ready'
            ? text.things.ovenReady(recipe.plural)
            : text.things.ovenBurnt;
      return (
        <>
          <span className={styles.status} data-testid="oven-status" data-stage={stage}>
            <GameIcon id={recipe.asset} decorative size="small" /> {words}
          </span>
          {stage === 'baking' ? (
            <progress
              className={styles.bar}
              aria-label={text.things.bakeProgress}
              max={recipe.bakeMs}
              value={game.oven.elapsedMs}
            />
          ) : null}
        </>
      );
    }
    default:
      return null;
  }
}

function Customers({ place, game, dispatch, leaving }: Required<SceneProps> & { place: Place }) {
  const queue = place.queue ?? [];
  const door = place.entrance ?? { x: 0, y: 100 };
  const patience = settingsFor(game).customerPatienceMs;
  return (
    <>
      <ul className={styles.customers} aria-label={text.things.customersHeading}>
        {game.customers.map((customer, index) => {
          const recipe = RECIPES[customer.wants];
          return (
            <li
              key={customer.id}
              className={styles.customer}
              style={{ ...standAt(queue[index] as Point), ...pointVars('from', door) }}
              data-testid="customer"
            >
              <button
                type="button"
                className={styles.customerButton}
                aria-label={text.things.serveLabel(recipe.name)}
                data-testid={`serve-${customer.wants}`}
                onClick={() =>
                  dispatch({ type: 'tap', target: { kind: 'customer', id: customer.id } })
                }
              >
                <span className={styles.bubble}>
                  <GameIcon id={recipe.asset} decorative />
                </span>
                <GameIcon id={customerLook(customer.id)} decorative size="large" />
                <progress
                  className={styles.bar}
                  aria-hidden
                  max={patience}
                  value={patience - customer.waitedMs}
                />
              </button>
            </li>
          );
        })}
      </ul>
      {leaving.map((left) => (
        <div
          key={left.id}
          className={styles.leaving}
          style={{ ...standAt(queue[left.queueIndex] as Point), ...pointVars('to', door) }}
          data-testid="leaving-customer"
          data-mood={left.mood}
          aria-hidden
        >
          {left.mood === 'calm' ? null : (
            <span className={styles.mood}>
              <GameIcon id={left.mood} decorative />
            </span>
          )}
          <GameIcon id={customerLook(left.id)} decorative size="large" />
        </div>
      ))}
    </>
  );
}

/**
 * Draws the place the baker is in: its background, the things to tap, the
 * people, and the baker. Everything that can be tapped is a real button.
 * This is the only component that knows how a place is drawn.
 */
export function Scene({ game, dispatch, leaving = [] }: SceneProps) {
  const place = PLACES[game.baker.place];
  return (
    <section
      className={`${styles.scene} ${styles[place.id]}`}
      aria-label={text.world.sceneLabel(place.name)}
      data-testid="scene"
      data-place={place.id}
    >
      {place.id === 'bakery' ? <div className={styles.counterTop} aria-hidden /> : null}
      {place.decor.map((decor, index) => (
        <span key={index} className={styles.decor} style={standAt(decor)} aria-hidden>
          <GameIcon id={decor.asset} decorative size="large" />
        </span>
      ))}

      {place.things.map((thing) => (
        <button
          key={thing.id}
          type="button"
          className={styles.thing}
          style={standAt(thing)}
          data-testid={`thing-${thing.id}`}
          onClick={() => dispatch({ type: 'tap', target: { kind: 'thing', id: thing.id } })}
        >
          <GameIcon id={thing.asset} decorative size="large" />
          {/* The spaces keep the words apart when a screen reader reads the button. */}
          <span className={styles.thingName}>{thing.name}</span>{' '}
          <ThingStatus thing={thing} game={game} />
        </button>
      ))}

      {place.people.map((person, index) => (
        <Character key={index} look={person.asset} at={person} />
      ))}
      {place.queue ? (
        <Customers place={place} game={game} dispatch={dispatch} leaving={leaving} />
      ) : null}

      <Character
        look={game.bakerLook}
        at={bakerPoint(game.baker)}
        walking={game.baker.walk !== null}
        name={text.world.baker(game.playerName)}
        testId="baker"
      />
    </section>
  );
}
