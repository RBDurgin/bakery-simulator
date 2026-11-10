import { INGREDIENTS, type IngredientId } from '../../content/ingredients';
import { RECIPES, RECIPE_IDS } from '../../content/recipes';
import { text } from '../../content/text';
import { formatCents } from '../../engine/money';
import { batchesPossible } from '../../engine/selectors';
import { Button } from '../components/Button';
import { GameIcon } from '../components/GameIcon';
import { Panel } from './Panel';
import styles from './panels.module.css';
import { recipeNeeds, type PanelProps } from './shared';

/** Buying at a market stall. This is where the budgeting happens. */
export function StallPanel({
  game,
  dispatch,
  ingredientId,
}: PanelProps & { ingredientId: IngredientId }) {
  const { name, price, asset } = INGREDIENTS[ingredientId];

  return (
    <Panel
      title={text.stall.heading(name)}
      closeLabel={text.stall.done}
      onClose={() => dispatch({ type: 'closePanel' })}
      testId="stall-panel"
    >
      <p className={styles.note}>
        <GameIcon id="coin" decorative /> {text.stall.yourMoney}:{' '}
        <strong data-testid="panel-money">{formatCents(game.money)}</strong>
      </p>

      <div className={`${styles.card} ${styles.row}`}>
        <GameIcon id={asset} decorative size="large" />
        <span className={styles.grow}>
          <span className={styles.name}>{name}</span>
          <span className={styles.detail} data-testid={`stock-${ingredientId}`}>
            {text.stall.have(game.ingredients[ingredientId])}
          </span>
        </span>
        <Button
          size="small"
          disabled={game.money < price}
          data-testid={`buy-${ingredientId}`}
          onClick={() => dispatch({ type: 'buyIngredient', ingredientId })}
        >
          {text.stall.buy} <span className={styles.srOnly}>{name}</span>{' '}
          {text.stall.forPrice(formatCents(price))}
        </Button>
      </div>

      <section className={styles.card} aria-labelledby="recipes-heading">
        <h3 id="recipes-heading" className={styles.cardHeading}>
          {text.stall.recipesHeading}
        </h3>
        <ul className={styles.list}>
          {RECIPE_IDS.map((id) => {
            const recipe = RECIPES[id];
            return (
              <li key={id} className={styles.row}>
                <GameIcon id={recipe.asset} decorative size="large" />
                <span className={styles.grow}>
                  <span className={styles.name}>{recipe.plural}</span>
                  <span className={styles.detail}>
                    {text.stall.needs} {recipeNeeds(id)}
                  </span>
                  <span className={styles.detail}>
                    {text.stall.makes(recipe.batchSize, formatCents(recipe.price))}
                  </span>
                  <span className={styles.name} data-testid={`batches-${id}`}>
                    {text.stall.batches(batchesPossible(game, id))}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </Panel>
  );
}
