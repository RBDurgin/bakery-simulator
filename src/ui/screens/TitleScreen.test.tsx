import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { text } from '../../content/text';
import { useGameStore } from '../../store/gameStore';
import { TitleScreen } from './TitleScreen';

describe('TitleScreen', () => {
  it('shows the game title and a start button', () => {
    render(<TitleScreen />);
    expect(screen.getByRole('heading', { level: 1, name: text.gameTitle })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.startButton })).toBeInTheDocument();
  });

  it('goes to the save slots when start is pressed', async () => {
    render(<TitleScreen />);
    await userEvent.click(screen.getByRole('button', { name: text.startButton }));
    expect(useGameStore.getState().screen).toBe('slots');
  });

  it('opens and closes the settings', async () => {
    render(<TitleScreen />);
    await userEvent.click(screen.getByRole('button', { name: text.settingsButton }));
    expect(screen.getByRole('dialog', { name: text.settings.heading })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: text.settings.done }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
