import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { text } from '../../content/text';
import type { GameState } from '../../engine/state';
import { useGameStore } from '../../store/gameStore';
import { at, eveningGame, newGame, openGame, stallGame } from '../../test/fixtures';
import { WorldScreen } from './WorldScreen';

const store = () => useGameStore.getState();
const world = () => screen.getByTestId('world');

function show(game: GameState) {
  useGameStore.setState({ screen: 'game', game });
  return render(<WorldScreen />);
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('WorldScreen', () => {
  it('renders nothing without a game', () => {
    const { container } = render(<WorldScreen />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the name, day, money, stars, place and time of day in view', () => {
    show(newGame({ bakeryName: 'Bun Fun', playerName: 'Ada', money: 1250 }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bun Fun');
    expect(screen.getByTestId('day')).toHaveTextContent('Day 1');
    expect(screen.getByTestId('money')).toHaveTextContent('$12.50');
    expect(screen.getByRole('img', { name: '3 out of 5 stars' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Home' })).toBeInTheDocument();
    expect(screen.getByTestId('time-of-day')).toHaveTextContent('Morning');
    expect(world()).toHaveAttribute('data-place', 'home');
    expect(world()).toHaveAttribute('data-phase', 'morning');
    expect(screen.queryByTestId('pause-button')).toBeNull();
  });

  it('says what happened in a line that screen readers announce', () => {
    show(newGame({ playerName: 'Ada', message: { id: 'goodMorning' } }));
    expect(screen.getByRole('status')).toHaveTextContent('Good morning, Ada!');
  });

  it('shows the evening by name', () => {
    show(eveningGame());
    expect(screen.getByTestId('time-of-day')).toHaveTextContent('Evening');
  });

  it('shows the shop clock while the shop is open', () => {
    show(openGame({ clockMs: 55_000 }));
    expect(screen.getByTestId('time-left')).toHaveTextContent('Shop closes in 2:05');
    expect(screen.getByRole('progressbar', { name: text.world.clockLabel })).toHaveValue(125_000);
    expect(screen.queryByTestId('time-of-day')).toBeNull();
  });

  it('opens the panel for the job, and the place behind it cannot be used', async () => {
    show(stallGame('flour'));
    expect(screen.getByRole('dialog', { name: 'Flour stall' })).toBeInTheDocument();
    expect(world()).toHaveAttribute('inert');

    await userEvent.click(screen.getByRole('button', { name: text.stall.done }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(world()).not.toHaveAttribute('inert');
  });

  it('shows the oven panel and the report panel', () => {
    const { unmount } = show(openGame({ panel: { type: 'oven' } }));
    expect(screen.getByTestId('oven-panel')).toBeInTheDocument();
    unmount();
    show(eveningGame({ panel: { type: 'report' } }));
    expect(screen.getByTestId('report-panel')).toBeInTheDocument();
  });

  it('pauses, and the pause screen can resume or close the shop', async () => {
    show(openGame());
    await userEvent.click(screen.getByRole('button', { name: text.world.pause }));
    expect(store().game?.paused).toBe(true);
    expect(screen.getByRole('dialog', { name: text.pause.heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.pause.resume })).toHaveFocus();
    expect(world()).toHaveAttribute('inert');

    await userEvent.keyboard('{Escape}');
    expect(store().game?.paused).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: text.world.pause }));
    await userEvent.click(screen.getByRole('button', { name: text.pause.closeShop }));
    expect(store().game?.phase).toBe('evening');
    expect(screen.getByRole('status')).toHaveTextContent(text.messages.closingTime);
  });

  describe('the clock', () => {
    beforeEach(() => {
      vi.useFakeTimers({
        toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
      });
    });

    afterEach(() => {
      vi.useRealTimers();
      setHidden(false);
    });

    const tap = (id: string) =>
      act(() => store().dispatch({ type: 'tap', target: { kind: 'thing', id } }));

    it('walks the baker in the morning without starting the shop clock', () => {
      show(newGame());
      tap('door');
      expect(screen.getByTestId('baker')).toHaveAttribute('data-walking', 'true');
      expect(screen.getByRole('status')).toHaveTextContent(text.world.walking);

      act(() => vi.advanceTimersByTime(3000));
      expect(world()).toHaveAttribute('data-place', 'street');
      expect(screen.getByRole('status')).toHaveTextContent(text.messages.arrived.street);
      expect(store().game?.clockMs).toBe(0);
    });

    it('runs the shop clock while the shop is open, and stops for pause and panels', () => {
      show(openGame({ ...at('bakery', 'oven') }));
      act(() => vi.advanceTimersByTime(500));
      const afterOpen = store().game?.clockMs ?? 0;
      expect(afterOpen).toBeGreaterThan(300);
      expect(afterOpen).toBeLessThanOrEqual(500);

      act(() => store().dispatch({ type: 'pause' }));
      act(() => vi.advanceTimersByTime(500));
      expect(store().game?.clockMs).toBe(afterOpen);

      act(() => store().dispatch({ type: 'resume' }));
      tap('oven');
      expect(screen.getByTestId('oven-panel')).toBeInTheDocument();
      const atOven = store().game?.clockMs ?? 0;
      act(() => vi.advanceTimersByTime(500));
      expect(store().game?.clockMs).toBe(atOven);

      act(() => store().dispatch({ type: 'closePanel' }));
      act(() => vi.advanceTimersByTime(500));
      expect(store().game?.clockMs).toBeGreaterThan(atOven);
    });

    it('pauses when the browser tab is hidden', () => {
      show(openGame());
      act(() => setHidden(false));
      expect(store().game?.paused).toBe(false);

      act(() => setHidden(true));
      expect(store().game?.paused).toBe(true);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
