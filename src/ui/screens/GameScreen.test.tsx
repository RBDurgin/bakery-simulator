import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { GameScreen } from './GameScreen';

const store = () => useGameStore.getState();

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('GameScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
  });

  it('renders nothing without a game', () => {
    const { container } = render(<GameScreen />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the screen for each phase of the day', () => {
    store().startNewGame({ bakeryName: 'Bun Fun', playerName: 'Ada' });
    render(<GameScreen />);
    expect(screen.getByTestId('morning-screen')).toBeInTheDocument();

    act(() => store().dispatch({ type: 'openShop' }));
    expect(screen.getByTestId('open-screen')).toBeInTheDocument();

    act(() => store().dispatch({ type: 'closeShop' }));
    expect(screen.getByTestId('evening-screen')).toBeInTheDocument();

    act(() => store().dispatch({ type: 'nextDay' }));
    expect(screen.getByTestId('day')).toHaveTextContent('Day 2');
  });

  it('runs the clock only while the shop is open and not paused', () => {
    store().startNewGame({ bakeryName: 'Bun Fun', playerName: 'Ada' });
    render(<GameScreen />);

    act(() => vi.advanceTimersByTime(500));
    expect(store().game?.clockMs).toBe(0);

    act(() => store().dispatch({ type: 'openShop' }));
    act(() => vi.advanceTimersByTime(500));
    const afterOpen = store().game?.clockMs ?? 0;
    expect(afterOpen).toBeGreaterThan(300);
    expect(afterOpen).toBeLessThanOrEqual(500);

    act(() => store().dispatch({ type: 'pause' }));
    act(() => vi.advanceTimersByTime(500));
    expect(store().game?.clockMs).toBe(afterOpen);

    act(() => store().dispatch({ type: 'resume' }));
    act(() => vi.advanceTimersByTime(500));
    expect(store().game?.clockMs).toBeGreaterThan(afterOpen);
  });

  it('pauses when the browser tab is hidden', () => {
    store().startNewGame({ bakeryName: 'Bun Fun', playerName: 'Ada' });
    render(<GameScreen />);
    act(() => store().dispatch({ type: 'openShop' }));

    act(() => setHidden(false));
    expect(store().game?.paused).toBe(false);

    act(() => setHidden(true));
    expect(store().game?.paused).toBe(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
