import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { text } from '../content/text';
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

  it('goes from the title, through the new game form, to the first morning at home', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: text.startButton }));
    expect(screen.getByRole('heading', { name: text.newGame.heading })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: text.newGame.back }));
    expect(screen.getByRole('heading', { name: text.gameTitle })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: text.startButton }));
    await user.click(screen.getByRole('button', { name: text.newGame.submit }));
    expect(screen.getByTestId('world')).toHaveAttribute('data-place', 'home');
    expect(screen.getByTestId('world')).toHaveAttribute('data-phase', 'morning');
    expect(screen.getByTestId('day')).toHaveTextContent('Day 1');
  });
});
