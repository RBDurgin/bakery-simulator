import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { text } from '../../content/text';
import type { GameState } from '../../engine/state';
import { readSlot } from '../../save/slots';
import { useGameStore } from '../../store/gameStore';
import { at, eveningGame, newGame, openGame } from '../../test/fixtures';
import { ReportPanel } from '../panels/ReportPanel';
import { messageText } from '../scene/messageText';
import { WorldScreen } from './WorldScreen';

const store = () => useGameStore.getState();

function show(game: GameState, extra: Partial<ReturnType<typeof store>> = {}) {
  useGameStore.setState({ screen: 'game', game, dayStart: game, slot: 1, ...extra });
  return render(<WorldScreen />);
}

describe('the menu', () => {
  it('opens outside shop hours, with no clock to stop and no shop to close', async () => {
    show(newGame());
    await userEvent.click(screen.getByRole('button', { name: text.world.menu }));
    expect(screen.getByRole('dialog', { name: text.menu.heading })).toBeInTheDocument();
    expect(screen.getByTestId('world')).toHaveAttribute('inert');
    expect(screen.queryByTestId('close-shop-button')).toBeNull();
    expect(screen.queryByTestId('quit-note')).toBeNull();
    expect(store().game?.paused).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: text.pause.resume }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: text.world.menu })).toHaveFocus();
  });

  it('saves and leaves for the title', async () => {
    show(newGame({ ...at('street', 'home'), bakeryName: 'Bun Fun' }));
    await userEvent.click(screen.getByRole('button', { name: text.world.menu }));
    await userEvent.click(screen.getByRole('button', { name: text.menu.quit }));
    expect(store()).toMatchObject({ screen: 'title', game: null });
    expect(readSlot(1)).toMatchObject({
      status: 'saved',
      save: { game: { baker: { place: 'street' } } },
    });
  });

  it('warns that leaving an open shop starts the day again', async () => {
    show(openGame());
    await userEvent.click(screen.getByRole('button', { name: text.world.pause }));
    expect(screen.getByTestId('quit-note')).toHaveTextContent(text.pause.quitNote);
    await userEvent.click(screen.getByRole('button', { name: text.pause.quit }));
    expect(store().screen).toBe('title');
    expect(readSlot(1).status).toBe('empty');
  });

  it('opens the settings and comes back to the menu', async () => {
    show(openGame());
    await userEvent.click(screen.getByRole('button', { name: text.world.pause }));
    await userEvent.click(screen.getByRole('button', { name: text.pause.settings }));
    expect(screen.getByRole('dialog', { name: text.settings.heading })).toBeInTheDocument();
    expect(screen.queryByTestId('pause-dialog')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: text.settings.done }));
    expect(screen.getByTestId('pause-dialog')).toBeInTheDocument();
    expect(store().game?.paused).toBe(true);
  });
});

describe('when saving fails', () => {
  it('says so, and the game can still be played', () => {
    show(newGame(), { saveFailed: true });
    expect(screen.getByRole('alert')).toHaveTextContent(text.world.saveFailed);
    expect(screen.getByTestId('world')).not.toHaveAttribute('inert');
  });

  it('says nothing when saving works', () => {
    show(newGame());
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('when a run has ended', () => {
  const ended = () =>
    eveningGame({
      ...at('bakery', 'till'),
      day: 5,
      difficulty: 'hard',
      loan: { owed: 2500, missed: 3 },
      tillCounted: true,
      ended: true,
    });

  it('says so kindly and offers the day again', async () => {
    const dayStart = newGame({ day: 5, difficulty: 'hard', loan: { owed: 2500, missed: 2 } });
    show(ended(), { dayStart });
    const dialog = screen.getByRole('alertdialog', { name: text.gameOver.heading });
    expect(dialog).toHaveTextContent('You missed 3 loan payments');
    expect(screen.getByTestId('world')).toHaveAttribute('inert');

    await userEvent.click(screen.getByRole('button', { name: text.gameOver.retry }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(store().game).toMatchObject({ day: 5, phase: 'morning', ended: false });
    expect(screen.getByTestId('world')).toHaveAttribute('data-place', 'home');
  });

  it('or goes back to the start', async () => {
    show(ended());
    await userEvent.click(screen.getByRole('button', { name: text.gameOver.quit }));
    expect(store().screen).toBe('title');
  });
});

describe('the loan on the evening report', () => {
  const report = (overrides: Partial<GameState>) =>
    render(
      <ReportPanel
        game={eveningGame({ panel: { type: 'report' }, ...overrides })}
        dispatch={() => {}}
      />,
    );
  const today = eveningGame().today;

  it('is not shown when there is no loan', () => {
    report({});
    expect(screen.queryByTestId('report-loan')).toBeNull();
  });

  it('shows what was paid back and what is still owed', () => {
    report({ loan: { owed: 1500, missed: 0 }, today: { ...today, repaid: 500 } });
    expect(screen.getByTestId('report-repaid')).toHaveTextContent('$5.00');
    expect(screen.getByTestId('report-owed')).toHaveTextContent('$15.00');
    expect(screen.getByTestId('report-loan-note')).toHaveTextContent(text.evening.loanExplained);
    expect(screen.getByTestId('report-profit')).toHaveTextContent('$0.00');
  });

  it('cheers when the loan is all paid back', () => {
    report({ loan: { owed: 0, missed: 0 }, today: { ...today, repaid: 300 } });
    expect(screen.getByTestId('report-loan-note')).toHaveTextContent(text.evening.loanDone);
  });

  it('says a payment was missed, with the count on Hard only', () => {
    const missed = { loan: { owed: 2500, missed: 1 }, today: { ...today, missedRepayment: true } };
    const { unmount } = report(missed);
    expect(screen.getByTestId('report-loan-note')).toHaveTextContent(text.evening.missed);
    unmount();
    report({ ...missed, difficulty: 'hard' });
    expect(screen.getByTestId('report-loan-note')).toHaveTextContent('That is 1 of 3 misses.');
  });
});

describe('messages about running out of money', () => {
  it('tells of the gift and of the loan', () => {
    expect(messageText(newGame({ message: { id: 'gift', amount: 2000 } }))).toBe(
      'Good morning! Grandma sent you $20.00 to help. Her tip: only buy what you can sell.',
    );
    expect(
      messageText(newGame({ message: { id: 'loan', amount: 2000, owed: 2500, repayment: 500 } })),
    ).toBe(
      'Good morning! The bank lent you $20.00. You owe $25.00 and pay back $5.00 each evening.',
    );
  });
});
