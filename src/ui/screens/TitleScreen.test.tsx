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

  it('goes to the new game screen when start is pressed', async () => {
    render(<TitleScreen />);
    await userEvent.click(screen.getByRole('button', { name: text.startButton }));
    expect(useGameStore.getState().screen).toBe('newGame');
  });
});
