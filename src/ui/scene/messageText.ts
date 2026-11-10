import { RECIPES, RECIPE_IDS } from '../../content/recipes';
import { text } from '../../content/text';
import { formatCents } from '../../engine/money';
import type { GameState } from '../../engine/state';

const m = text.messages;

/** Puts the engine's last message into words, for the line under the scene. */
export function messageText(game: GameState): string {
  const { message } = game;
  if (!message) return game.baker.walk ? text.world.walking : '';
  switch (message.id) {
    case 'goodMorning':
      return m.goodMorning(game.playerName);
    case 'arrived':
      return m.arrived[message.place];
    case 'bakingStarted':
    case 'ovenBaking':
    case 'burnt':
      return m[message.id](RECIPES[message.recipeId].plural);
    case 'tookOut': {
      const { batchSize, plural } = RECIPES[message.recipeId];
      return m.tookOut(batchSize, plural);
    }
    case 'served': {
      const { name, price } = RECIPES[message.recipeId];
      return m.served(name, formatCents(price));
    }
    case 'noStock':
      return m.noStock(RECIPES[message.recipeId].name);
    case 'shelf': {
      const items = RECIPE_IDS.filter((id) => game.shelf[id] > 0).map(
        (id) => `${game.shelf[id]} ${game.shelf[id] === 1 ? RECIPES[id].name : RECIPES[id].plural}`,
      );
      return items.length === 0 ? m.shelfEmpty : m.shelf(items.join(', '));
    }
    default:
      return m[message.id];
  }
}
