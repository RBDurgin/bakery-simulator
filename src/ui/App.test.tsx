import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
