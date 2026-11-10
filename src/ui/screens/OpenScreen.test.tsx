import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BALANCE } from '../../content/balance';
import { RECIPES } from '../../content/recipes';
import { text } from '../../content/text';
import { openGame } from '../../test/fixtures';
import { OpenScreen } from './OpenScreen';

describe('OpenScreen', () => {
  it('shows the time left and an empty shop', () => {
    render(<OpenScreen game={openGame({ clockMs: 55_000 })} dispatch={vi.fn()} />);
    expect(screen.getByTestId('time-left')).toHaveTextContent('Shop closes in 2:05');
    expect(screen.getByText(text.open.noCustomers)).toBeInTheDocument();
    expect(screen.getByTestId('shelf-cookie')).toHaveTextContent('0');
  });

  it('offers recipes for an empty oven, and only those with enough ingredients', async () => {
    const dispatch = vi.fn();
    const game = openGame({ ingredients: { flour: 1, sugar: 1, butter: 1, egg: 0 } });
    render(<OpenScreen game={game} dispatch={dispatch} />);

    expect(screen.getByRole('button', { name: /Bake Muffins/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Bake Cookies/ }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'startBaking', recipeId: 'cookie' });
  });

  it('shows baking progress', () => {
    const game = openGame({ oven: { status: 'baking', recipeId: 'bread', elapsedMs: 5000 } });
    render(<OpenScreen game={game} dispatch={vi.fn()} />);
    expect(screen.getByText(/Baking Bread/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: text.open.bakeProgress })).toHaveValue(5000);
    expect(screen.queryByTestId('take-out-button')).toBeNull();
  });

  it('lets the player take out a ready batch', async () => {
    const dispatch = vi.fn();
    const game = openGame({
      oven: { status: 'baking', recipeId: 'cookie', elapsedMs: RECIPES.cookie.bakeMs },
    });
    render(<OpenScreen game={game} dispatch={dispatch} />);

    expect(screen.getByTestId('oven-message')).toHaveTextContent('Ding! Cookies ready.');
    await userEvent.click(screen.getByRole('button', { name: text.open.takeOut }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'takeOut' });
  });

  it('explains a burnt batch kindly', () => {
    const game = openGame({
      oven: {
        status: 'baking',
        recipeId: 'cookie',
        elapsedMs: RECIPES.cookie.bakeMs + BALANCE.burnWindowMs,
      },
    });
    render(<OpenScreen game={game} dispatch={vi.fn()} />);
    expect(screen.getByTestId('oven-message')).toHaveTextContent('the Cookies burnt');
    expect(screen.getByRole('button', { name: text.open.clearOven })).toBeInTheDocument();
  });

  it('lists customers and serves the ones whose order is on the shelf', async () => {
    const dispatch = vi.fn();
    const game = openGame({
      shelf: { cookie: 3, muffin: 0, bread: 0 },
      customers: [
        { id: 7, wants: 'cookie', waitedMs: 1000 },
        { id: 8, wants: 'muffin', waitedMs: 0 },
      ],
    });
    render(<OpenScreen game={game} dispatch={dispatch} />);

    const customers = within(screen.getByTestId('customers')).getAllByRole('listitem');
    expect(customers).toHaveLength(2);
    expect(customers[0]).toHaveTextContent('Wants: Cookie');
    expect(screen.getByRole('button', { name: 'Serve Muffin' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Serve Cookie' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'serveCustomer', customerId: 7 });
  });

  it('pauses, and the pause screen can resume or close the shop', async () => {
    const dispatch = vi.fn();
    const { rerender } = render(<OpenScreen game={openGame()} dispatch={dispatch} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: text.open.pause }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'pause' });

    rerender(<OpenScreen game={openGame({ paused: true })} dispatch={dispatch} />);
    expect(screen.getByRole('dialog', { name: text.pause.heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.pause.resume })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: text.pause.resume }));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'resume' });

    await userEvent.keyboard('{Escape}');
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'resume' });
    expect(dispatch).toHaveBeenCalledTimes(3);

    await userEvent.click(screen.getByRole('button', { name: text.pause.closeShop }));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'closeShop' });
  });
});
