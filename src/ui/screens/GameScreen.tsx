import { useGameStore } from '../../store/gameStore';
import { useGameClock } from '../hooks/useGameClock';
import { EveningScreen } from './EveningScreen';
import { MorningScreen } from './MorningScreen';
import { OpenScreen } from './OpenScreen';

/** Shows the screen for the current day phase and runs the clock while the shop is open. */
export function GameScreen() {
  const game = useGameStore((store) => store.game);
  const dispatch = useGameStore((store) => store.dispatch);
  useGameClock(game?.phase === 'open' && !game.paused);

  if (!game) return null;
  switch (game.phase) {
    case 'morning':
      return <MorningScreen game={game} dispatch={dispatch} />;
    case 'open':
      return <OpenScreen game={game} dispatch={dispatch} />;
    case 'evening':
      return <EveningScreen game={game} dispatch={dispatch} />;
  }
}
