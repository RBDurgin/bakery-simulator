import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { text } from '../../content/text';
import { newGame } from '../../test/fixtures';
import { MorningScreen } from './MorningScreen';

describe('MorningScreen', () => {
  it('shows the names, money and stock', () => {
    const game = newGame({
      bakeryName: 'Bun Fun',
      playerName: 'Ada',
      money: 1250,
      ingredients: { flour: 2, sugar: 1, butter: 1, egg: 0 },
    });
    render(<MorningScreen game={game} dispatch={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bun Fun');
    expect(screen.getByRole('heading', { name: 'Good morning, Ada!' })).toBeInTheDocument();
    expect(screen.getByTestId('money')).toHaveTextContent('$12.50');
    expect(screen.getByTestId('stock-flour')).toHaveTextContent('You have 2');
    expect(screen.getByTestId('batches-cookie')).toHaveTextContent('You can bake 1 batch.');
    expect(screen.getByTestId('batches-muffin')).toHaveTextContent('You need more ingredients.');
    expect(screen.getByRole('img', { name: '3 out of 5 stars' })).toBeInTheDocument();
    expect(screen.queryByText(text.morning.nothingToBake)).toBeNull();
  });

  it('buys an ingredient and opens the shop through actions', async () => {
    const dispatch = vi.fn();
    render(<MorningScreen game={newGame()} dispatch={dispatch} />);

    await userEvent.click(screen.getByRole('button', { name: 'Buy Butter for $2.00' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'buyIngredient', ingredientId: 'butter' });

    await userEvent.click(screen.getByRole('button', { name: text.morning.openShop }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'openShop' });
  });

  it('disables buying what the player cannot afford and gives a tip', () => {
    render(<MorningScreen game={newGame({ money: 150 })} dispatch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Buy Butter for $2.00' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buy Flour for $1.00' })).toBeEnabled();
    expect(screen.getByText(text.morning.nothingToBake)).toBeInTheDocument();
  });
});
