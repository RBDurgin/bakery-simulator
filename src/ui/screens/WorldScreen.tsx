import { BALANCE } from '../../content/balance';
import { PLACES } from '../../content/places';
import { text } from '../../content/text';
import { timeLeftMs } from '../../engine/selectors';
import type { GameState } from '../../engine/state';
import { useGameStore } from '../../store/gameStore';
import { AppShell } from '../AppShell';
import { Button } from '../components/Button';
import { GameIcon } from '../components/GameIcon';
import { PauseDialog } from '../components/PauseDialog';
import { ShopSign } from '../components/ShopSign';
import { useGameClock } from '../hooks/useGameClock';
import { OvenPanel } from '../panels/OvenPanel';
import { ReportPanel } from '../panels/ReportPanel';
import { StallPanel } from '../panels/StallPanel';
import { messageText } from '../scene/messageText';
import { Scene } from '../scene/Scene';
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
  const dispatch = useGameStore((store) => store.dispatch);
  useGameClock(game !== null && !game.paused && !game.panel);

  if (!game) return null;
  const place = PLACES[game.baker.place];
  const { panel } = game;

  return (
    <AppShell>
      <div
        className={styles.world}
        inert={game.paused || panel !== null}
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
          {game.phase === 'open' ? (
            <Button
              size="small"
              variant="secondary"
              onClick={() => dispatch({ type: 'pause' })}
              data-testid="pause-button"
            >
              {text.world.pause}
            </Button>
          ) : null}
        </div>
      </div>

      {panel?.type === 'stall' ? (
        <StallPanel game={game} dispatch={dispatch} ingredientId={panel.ingredientId} />
      ) : null}
      {panel?.type === 'oven' ? <OvenPanel game={game} dispatch={dispatch} /> : null}
      {panel?.type === 'report' ? <ReportPanel game={game} dispatch={dispatch} /> : null}
      {game.paused ? (
        <PauseDialog
          onResume={() => dispatch({ type: 'resume' })}
          onCloseShop={() => dispatch({ type: 'closeShop' })}
        />
      ) : null}
    </AppShell>
  );
}
