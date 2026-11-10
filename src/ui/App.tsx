import { useGameStore } from '../store/gameStore';
import { AppShell } from './AppShell';
import { GameScreen } from './screens/GameScreen';
import { NewGameScreen } from './screens/NewGameScreen';
import { TitleScreen } from './screens/TitleScreen';

export function App() {
  const screen = useGameStore((store) => store.screen);

  if (screen === 'game') return <GameScreen />;
  return <AppShell>{screen === 'newGame' ? <NewGameScreen /> : <TitleScreen />}</AppShell>;
}
