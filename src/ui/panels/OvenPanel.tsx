import { RECIPES, RECIPE_IDS } from '../../content/recipes';
import { text } from '../../content/text';
import { batchesPossible } from '../../engine/selectors';
import { Button } from '../components/Button';
import { GameIcon } from '../components/GameIcon';
import { Panel } from './Panel';
import styles from './panels.module.css';
import { recipeNeeds, type PanelProps } from './shared';

/** Picking what to bake, at the oven. */
export function OvenPanel({ game, dispatch }: PanelProps) {
  return (
    <Panel
      title={text.oven.heading}
      closeLabel={text.oven.notNow}
      onClose={() => dispatch({ type: 'closePanel' })}
      testId="oven-panel"
    >
      <div className={styles.card}>
        <ul className={styles.list}>
          {RECIPE_IDS.map((id) => {
            const recipe = RECIPES[id];
            const canBake = batchesPossible(game, id) > 0;
            return (
              <li key={id} className={styles.row}>
                <GameIcon id={recipe.asset} decorative size="large" />
                <span className={styles.grow}>
                  <span className={styles.name}>{recipe.plural}</span>
                  <span className={styles.detail}>
                    {text.stall.needs} {recipeNeeds(id)}
                  </span>
                  {canBake ? null : <span className={styles.detail}>{text.oven.cannotBake}</span>}
                </span>
                <Button
                  size="small"
                  disabled={!canBake}
                  aria-label={text.oven.bakeLabel(recipe.plural)}
                  data-testid={`bake-${id}`}
                  onClick={() => dispatch({ type: 'startBaking', recipeId: id })}
                >
                  {text.oven.bake}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}
