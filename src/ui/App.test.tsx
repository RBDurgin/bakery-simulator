import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { text } from '../content/text';
import { readSlot } from '../save/slots';
import { useSettingsStore } from '../store/settingsStore';
import { App } from './App';
import { AppShell } from './AppShell';

describe('App', () => {
  it('renders the title screen inside the app shell', () => {
    render(<App />);
    expect(screen.getByTestId('app-shell')).toContainElement(
      screen.getByRole('heading', { level: 1 }),
    );
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('renders a bottom bar when one is given', () => {
    render(<AppShell bottomBar={<button type="button">Menu</button>}>Body</AppShell>);
    expect(screen.getByRole('navigation')).toContainElement(
      screen.getByRole('button', { name: 'Menu' }),
    );
  });

  it('goes from the title, through the save slots and the new game form, to the first morning', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: text.startButton }));
    expect(screen.getByRole('heading', { name: text.slots.heading })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: text.slots.back }));
    expect(screen.getByRole('heading', { name: text.gameTitle })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: text.startButton }));
    await user.click(screen.getByRole('button', { name: text.slots.newGameLabel(2) }));
    expect(screen.getByRole('heading', { name: text.newGame.heading })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: text.newGame.back }));
    await user.click(screen.getByRole('button', { name: text.slots.newGameLabel(2) }));
    await user.click(screen.getByRole('button', { name: text.newGame.submit }));
    expect(screen.getByTestId('world')).toHaveAttribute('data-place', 'home');
    expect(screen.getByTestId('world')).toHaveAttribute('data-phase', 'morning');
    expect(screen.getByTestId('day')).toHaveTextContent('Day 1');
    expect(readSlot(2).status).toBe('saved');
  });

  it('puts the settings on the page for the stylesheets', () => {
    render(<App />);
    expect(document.documentElement.dataset.textSize).toBe('normal');
    expect(document.documentElement.dataset.motion).toBe('full');

    act(() => useSettingsStore.getState().change({ textSize: 'larger', reducedMotion: true }));
    expect(document.documentElement.dataset.textSize).toBe('larger');
    expect(document.documentElement.dataset.motion).toBe('reduced');
  });

  it('follows the device for less movement until the player chooses', () => {
    const listeners: (() => void)[] = [];
    const query = {
      matches: true,
      addEventListener: (_: string, listener: () => void) => listeners.push(listener),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('matchMedia', () => query);
    const { unmount } = render(<App />);
    expect(document.documentElement.dataset.motion).toBe('reduced');

    query.matches = false;
    act(() => listeners.forEach((listener) => listener()));
    expect(document.documentElement.dataset.motion).toBe('full');

    act(() => useSettingsStore.getState().change({ reducedMotion: true }));
    expect(document.documentElement.dataset.motion).toBe('reduced');
    unmount();
    expect(query.removeEventListener).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
