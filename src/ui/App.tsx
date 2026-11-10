import { useGameStore } from '../store/gameStore';
import { AppShell } from './AppShell';
import { NewGameScreen } from './screens/NewGameScreen';
import { TitleScreen } from './screens/TitleScreen';
import { WorldScreen } from './screens/WorldScreen';

export function App() {
  const screen = useGameStore((store) => store.screen);

  if (screen === 'game') return <WorldScreen />;
  return <AppShell>{screen === 'newGame' ? <NewGameScreen /> : <TitleScreen />}</AppShell>;
}
