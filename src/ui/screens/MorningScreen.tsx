import { INGREDIENTS, INGREDIENT_IDS } from '../../content/ingredients';
import { RECIPES, RECIPE_IDS } from '../../content/recipes';
import { text } from '../../content/text';
import type { Action } from '../../engine/game';
import { formatCents } from '../../engine/money';
import { batchesPossible } from '../../engine/selectors';
import type { GameState } from '../../engine/state';
import { AppShell } from '../AppShell';
import { Button } from '../components/Button';
import { GameIcon } from '../components/GameIcon';
import { ShopSign } from '../components/ShopSign';
import styles from './game.module.css';

interface ScreenProps {
  game: GameState;
  dispatch: (action: Action) => void;
}

/** Morning: no clock. Check money, buy ingredients, then open the shop. */
export function MorningScreen({ game, dispatch }: ScreenProps) {
  const canBakeSomething = RECIPE_IDS.some((id) => batchesPossible(game, id) > 0);

  return (
    <AppShell
      bottomBar={
        <div className={styles.bottom}>
          <Button onClick={() => dispatch({ type: 'openShop' })} data-testid="open-shop-button">
            {text.morning.openShop}
          </Button>
        </div>
      }
    >
      <div className={styles.screen} data-testid="morning-screen">
        <ShopSign game={game} />
        <h2 className={styles.heading}>{text.morning.heading(game.playerName)}</h2>
        <p className={styles.intro}>{text.morning.intro}</p>

        <section className={styles.card} aria-labelledby="shop-heading">
          <h3 id="shop-heading" className={styles.cardHeading}>
            {text.morning.shopHeading}
          </h3>
          <ul className={styles.list}>
            {INGREDIENT_IDS.map((id) => {
              const { name, price, asset } = INGREDIENTS[id];
              return (
                <li key={id} className={styles.row}>
                  <GameIcon id={asset} decorative size="large" />
                  <span className={styles.grow}>
                    <span className={styles.name}>{name}</span>
                    <span className={styles.detail} data-testid={`stock-${id}`}>
                      {text.morning.have(game.ingredients[id])}
                    </span>
                  </span>
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={game.money < price}
                    data-testid={`buy-${id}`}
                    onClick={() => dispatch({ type: 'buyIngredient', ingredientId: id })}
                  >
                    {text.morning.buy} <span className={styles.srOnly}>{name} for</span>{' '}
                    {formatCents(price)}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="recipes-heading">
          <h3 id="recipes-heading" className={styles.cardHeading}>
            {text.morning.recipesHeading}
          </h3>
          <ul className={styles.list}>
            {RECIPE_IDS.map((id) => {
              const recipe = RECIPES[id];
              const needs = INGREDIENT_IDS.filter((i) => recipe.ingredients[i])
                .map((i) => `${recipe.ingredients[i]} ${INGREDIENTS[i].name}`)
                .join(', ');
              return (
                <li key={id} className={styles.row}>
                  <GameIcon id={recipe.asset} decorative size="large" />
                  <span className={styles.grow}>
                    <span className={styles.name}>{recipe.plural}</span>
                    <span className={styles.detail}>
                      {text.morning.needs} {needs}
                    </span>
                    <span className={styles.detail}>
                      {text.morning.makes(recipe.batchSize, formatCents(recipe.price))}
                    </span>
                    <span className={styles.name} data-testid={`batches-${id}`}>
                      {text.morning.batches(batchesPossible(game, id))}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {canBakeSomething ? null : <p className={styles.tip}>{text.morning.nothingToBake}</p>}
      </div>
    </AppShell>
  );
}
