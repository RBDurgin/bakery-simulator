import { useGameStore } from '../store/gameStore';
import { AppShell } from './AppShell';
import { useApplySettings } from './motion';
import { NewGameScreen } from './screens/NewGameScreen';
import { SlotsScreen } from './screens/SlotsScreen';
import { TitleScreen } from './screens/TitleScreen';
import { WorldScreen } from './screens/WorldScreen';

export function App() {
  const screen = useGameStore((store) => store.screen);
  useApplySettings();

  if (screen === 'game') return <WorldScreen />;
  return (
    <AppShell>
      {screen === 'newGame' ? (
        <NewGameScreen />
      ) : screen === 'slots' ? (
        <SlotsScreen />
      ) : (
        <TitleScreen />
      )}
    </AppShell>
  );
}
