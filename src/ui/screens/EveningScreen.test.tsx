import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { text } from '../../content/text';
import { newGame } from '../../test/fixtures';
import type { DayStats, GameState } from '../../engine/state';
import { EveningScreen } from './EveningScreen';

function evening(today: Partial<DayStats>, overrides: Partial<GameState> = {}): GameState {
  const game = newGame({ phase: 'evening', bakeryName: 'Bun Fun', playerName: 'Ada' });
  return { ...game, ...overrides, today: { ...game.today, ...today } };
}

describe('EveningScreen', () => {
  it('reports income, costs and profit with the names on it', () => {
    const game = evening({
      income: 900,
      spent: 400,
      sold: { cookie: 6, muffin: 1, bread: 0 },
      wasted: { cookie: 0, muffin: 3, bread: 0 },
      happyCustomers: 7,
      lostCustomers: 2,
    });
    render(<EveningScreen game={game} dispatch={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Day 1 is done!' })).toBeInTheDocument();
    expect(screen.getByTestId('report-for')).toHaveTextContent("Ada's report for Bun Fun");
    expect(screen.getByTestId('report-income')).toHaveTextContent('$9.00');
    expect(screen.getByTestId('report-spent')).toHaveTextContent('$4.00');
    expect(screen.getByTestId('report-profit')).toHaveTextContent('$5.00');
    expect(screen.getByTestId('report-profit-sentence')).toHaveTextContent(
      'You made $5.00 more than you spent.',
    );
    expect(screen.getByTestId('report-sold')).toHaveTextContent('6 Cookies');
    expect(screen.getByTestId('report-sold')).toHaveTextContent('1 Muffin');
    expect(screen.getByTestId('report-sold')).not.toHaveTextContent('Bread');
    expect(screen.getByTestId('report-wasted')).toHaveTextContent('3 Muffins');
    expect(screen.getByTestId('report-happy')).toHaveTextContent('7');
    expect(screen.getByTestId('report-lost')).toHaveTextContent('2');
  });

  it('is kind about a loss', () => {
    render(<EveningScreen game={evening({ income: 100, spent: 400 })} dispatch={vi.fn()} />);
    expect(screen.getByTestId('report-profit')).toHaveTextContent('-$3.00');
    expect(screen.getByTestId('report-profit-sentence')).toHaveTextContent(
      'You spent $3.00 more than you earned. That is okay!',
    );
  });

  it('handles a day where nothing happened', () => {
    render(<EveningScreen game={evening({})} dispatch={vi.fn()} />);
    expect(screen.getByTestId('report-profit-sentence')).toHaveTextContent(text.evening.profitEven);
    expect(screen.getByText(text.evening.nothingSold)).toBeInTheDocument();
    expect(screen.getByText(text.evening.nothingWasted)).toBeInTheDocument();
  });

  it('continues to the next day', async () => {
    const dispatch = vi.fn();
    render(<EveningScreen game={evening({}, { day: 3 })} dispatch={dispatch} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start day 4' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'nextDay' });
  });
});
