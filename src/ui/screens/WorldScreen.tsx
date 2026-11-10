import { useState } from 'react';
import { BALANCE } from '../../content/balance';
import { PLACES } from '../../content/places';
import { text } from '../../content/text';
import { timeLeftMs } from '../../engine/selectors';
import type { GameState } from '../../engine/state';
import { useGameStore } from '../../store/gameStore';
import { AppShell } from '../AppShell';
import { Button } from '../components/Button';
import { GameIcon } from '../components/GameIcon';
import { Dialog } from '../components/Dialog';
import dialogStyles from '../components/Dialog.module.css';
import { MenuDialog } from '../components/MenuDialog';
import { ShopSign } from '../components/ShopSign';
import { useGameClock } from '../hooks/useGameClock';
import { OvenPanel } from '../panels/OvenPanel';
import { ReportPanel } from '../panels/ReportPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { StallPanel } from '../panels/StallPanel';
import { messageText } from '../scene/messageText';
import { Scene } from '../scene/Scene';
import { useSounds } from '../sound';
import styles from './WorldScreen.module.css';

/** Shows milliseconds as minutes and seconds, for example 2:05. */
function formatClock(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** The shop clock while the shop is open; otherwise just the time of day. */
function TimeOfDay({ game }: { game: GameState }) {
  if (game.phase !== 'open') {
    return (
      <p className={styles.time} data-testid="time-of-day">
        <GameIcon id={game.phase} decorative /> {text.phase[game.phase]}
      </p>
    );
  }
  const timeLeft = timeLeftMs(game);
  return (
    <div className={styles.time}>
      <p className={styles.clock}>
        <GameIcon id="clock" decorative />{' '}
        <span data-testid="time-left">{text.world.closesIn(formatClock(timeLeft))}</span>
      </p>
      <progress
        className={styles.bar}
        aria-label={text.world.clockLabel}
        max={BALANCE.dayLengthMs}
        value={timeLeft}
      />
    </div>
  );
}

/**
 * The game: the place the baker is in, with money, stars and the time always
 * in view. Panels open over it, and time stands still while one is open.
 */
export function WorldScreen() {
  const game = useGameStore((store) => store.game);
  const leaving = useGameStore((store) => store.leaving);
  const saveFailed = useGameStore((store) => store.saveFailed);
  const dispatch = useGameStore((store) => store.dispatch);
  const quitToTitle = useGameStore((store) => store.quitToTitle);
  const retryDay = useGameStore((store) => store.retryDay);
  // The menu outside shop hours. While the shop is open the engine's pause does this job.
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const stopped = game === null || game.paused || game.panel !== null || game.ended || menuOpen;
  useGameClock(!stopped);
  useSounds(game);

  if (!game) return null;
  const place = PLACES[game.baker.place];
  const { panel } = game;
  const shopOpen = game.phase === 'open';
  const menuShown = (game.paused || menuOpen) && !game.ended;

  return (
    <AppShell>
      <div
        className={styles.world}
        inert={stopped}
        data-testid="world"
        data-phase={game.phase}
        data-place={place.id}
      >
        <ShopSign game={game} />
        <div className={styles.where}>
          <h2 className={styles.place} data-testid="place-name">
            <GameIcon id={place.asset} decorative /> {place.name}
          </h2>
          <TimeOfDay game={game} />
        </div>
        <Scene game={game} dispatch={dispatch} leaving={leaving} />
        <div className={styles.below}>
          <p className={styles.message} role="status" data-testid="message">
            {messageText(game)}
          </p>
          {shopOpen ? (
            <Button
              size="small"
              variant="secondary"
              onClick={() => dispatch({ type: 'pause' })}
              data-testid="pause-button"
            >
              {text.world.pause}
            </Button>
          ) : (
            <Button
              size="small"
              variant="secondary"
              onClick={() => setMenuOpen(true)}
              data-testid="menu-button"
            >
              {text.world.menu}
            </Button>
          )}
        </div>
        {saveFailed ? (
          <p className={styles.warning} role="alert" data-testid="save-warning">
            {text.world.saveFailed}
          </p>
        ) : null}
      </div>

      {panel?.type === 'stall' ? (
        <StallPanel game={game} dispatch={dispatch} ingredientId={panel.ingredientId} />
      ) : null}
      {panel?.type === 'oven' ? <OvenPanel game={game} dispatch={dispatch} /> : null}
      {panel?.type === 'report' ? <ReportPanel game={game} dispatch={dispatch} /> : null}
      {menuShown && !settingsOpen ? (
        <MenuDialog
          shopOpen={shopOpen}
          onResume={() => {
            setMenuOpen(false);
            dispatch({ type: 'resume' });
          }}
          onCloseShop={() => dispatch({ type: 'closeShop' })}
          onSettings={() => setSettingsOpen(true)}
          onQuit={quitToTitle}
        />
      ) : null}
      {menuShown && settingsOpen ? <SettingsPanel onClose={() => setSettingsOpen(false)} /> : null}
      {game.ended ? (
        <Dialog alert heading={text.gameOver.heading} testId="game-over-dialog">
          <p className={dialogStyles.body}>{text.gameOver.body(game.loan.missed)}</p>
          <Button onClick={retryDay} data-testid="retry-day-button">
            {text.gameOver.retry}
          </Button>
          <Button variant="secondary" onClick={quitToTitle} data-testid="quit-button">
            {text.gameOver.quit}
          </Button>
        </Dialog>
      ) : null}
    </AppShell>
  );
}
