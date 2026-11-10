import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { text } from '../../content/text';
import { TitleScreen } from './TitleScreen';

describe('TitleScreen', () => {
  it('shows the game title and a start button', () => {
    render(<TitleScreen />);
    expect(screen.getByRole('heading', { level: 1, name: text.gameTitle })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.startButton })).toBeInTheDocument();
  });

  it('shows a friendly coming-soon message when start is pressed', async () => {
    render(<TitleScreen />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await userEvent.click(screen.getByRole('button', { name: text.startButton }));

    expect(screen.getByRole('status')).toHaveTextContent(text.comingSoon);
  });
});
