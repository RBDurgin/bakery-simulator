import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { text } from '../../content/text';
import type { DayStats, GameState } from '../../engine/state';
import { eveningGame, openGame, stallGame } from '../../test/fixtures';
import { OvenPanel } from './OvenPanel';
import { Panel } from './Panel';
import { ReportPanel } from './ReportPanel';
import { StallPanel } from './StallPanel';

describe('Panel', () => {
  it('is a named dialog that takes the focus and gives it back', async () => {
    const onClose = vi.fn();
    const Page = ({ open }: { open: boolean }) => (
      <>
        <button type="button">Stall</button>
        {open ? (
          <Panel title="Flour stall" closeLabel="Done" onClose={onClose} testId="a-panel">
            <p>Inside</p>
          </Panel>
        ) : null}
      </>
    );
    const { rerender } = render(<Page open={false} />);
    screen.getByRole('button', { name: 'Stall' }).focus();

    rerender(<Page open />);
    const dialog = screen.getByRole('dialog', { name: 'Flour stall' });
    expect(dialog).toHaveFocus();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText('Inside')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('a');
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<Page open={false} />);
    expect(screen.getByRole('button', { name: 'Stall' })).toHaveFocus();
  });

  it('does not try to give the focus back to something that has gone', () => {
    const { unmount } = render(
      <Panel title="Report" closeLabel="Done" onClose={vi.fn()} testId="a-panel">
        <p>Inside</p>
      </Panel>,
    );
    expect(() => unmount()).not.toThrow();
  });
});

describe('StallPanel', () => {
  const show = (game: GameState, dispatch = vi.fn()) =>
    render(<StallPanel game={game} dispatch={dispatch} ingredientId="butter" />);

  it('shows the money, the stock and what can be baked', () => {
    show(
      stallGame('butter', { money: 1250, ingredients: { flour: 2, sugar: 1, butter: 1, egg: 0 } }),
    );
    expect(screen.getByRole('dialog', { name: 'Butter stall' })).toBeInTheDocument();
    expect(screen.getByTestId('panel-money')).toHaveTextContent('$12.50');
    expect(screen.getByTestId('stock-butter')).toHaveTextContent('You have 1');
    expect(screen.getByTestId('batches-cookie')).toHaveTextContent('You can bake 1 batch.');
    expect(screen.getByTestId('batches-muffin')).toHaveTextContent('You need more ingredients.');
    expect(screen.getByText('Needs: 2 Flour, 1 Egg')).toBeInTheDocument();
  });

  it('counts batches in the plural', () => {
    show(stallGame('butter', { ingredients: { flour: 2, sugar: 2, butter: 2, egg: 0 } }));
    expect(screen.getByTestId('batches-cookie')).toHaveTextContent('You can bake 2 batches.');
  });

  it('buys one at a time and closes through actions', async () => {
    const dispatch = vi.fn();
    show(stallGame('butter'), dispatch);
    await userEvent.click(screen.getByRole('button', { name: 'Buy 1 Butter for $2.00' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'buyIngredient', ingredientId: 'butter' });
    await userEvent.click(screen.getByRole('button', { name: text.stall.done }));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'closePanel' });
  });

  it('disables buying what the player cannot afford', () => {
    show(stallGame('butter', { money: 150 }));
    expect(screen.getByRole('button', { name: 'Buy 1 Butter for $2.00' })).toBeDisabled();
  });
});

describe('OvenPanel', () => {
  it('offers the recipes, and only those with enough ingredients', async () => {
    const dispatch = vi.fn();
    const game = openGame({
      panel: { type: 'oven' },
      ingredients: { flour: 1, sugar: 1, butter: 1, egg: 0 },
    });
    render(<OvenPanel game={game} dispatch={dispatch} />);

    expect(screen.getByRole('dialog', { name: text.oven.heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bake Muffins' })).toBeDisabled();
    expect(screen.getAllByText(text.oven.cannotBake)).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Bake Cookies' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'startBaking', recipeId: 'cookie' });

    await userEvent.click(screen.getByRole('button', { name: text.oven.notNow }));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'closePanel' });
  });
});

describe('ReportPanel', () => {
  function report(today: Partial<DayStats>, overrides: Partial<GameState> = {}) {
    const game = eveningGame({
      bakeryName: 'Bun Fun',
      playerName: 'Ada',
      panel: { type: 'report' },
      ...overrides,
    });
    const dispatch = vi.fn();
    render(
      <ReportPanel game={{ ...game, today: { ...game.today, ...today } }} dispatch={dispatch} />,
    );
    return dispatch;
  }

  it('reports income, costs and profit with the names on it', () => {
    report({
      income: 900,
      spent: 400,
      sold: { cookie: 6, muffin: 1, bread: 0 },
      wasted: { cookie: 0, muffin: 3, bread: 0 },
      happyCustomers: 7,
      lostCustomers: 2,
    });

    expect(screen.getByRole('dialog', { name: 'Day 1 is done!' })).toBeInTheDocument();
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
    expect(screen.getByRole('img', { name: '3 out of 5 stars' })).toBeInTheDocument();
  });

  it('is kind about a loss', () => {
    report({ income: 100, spent: 400 });
    expect(screen.getByTestId('report-profit')).toHaveTextContent('-$3.00');
    expect(screen.getByTestId('report-profit-sentence')).toHaveTextContent(
      'You spent $3.00 more than you earned. That is okay!',
    );
  });

  it('handles a day where nothing happened', () => {
    report({});
    expect(screen.getByTestId('report-profit-sentence')).toHaveTextContent(text.evening.profitEven);
    expect(screen.getByText(text.evening.nothingSold)).toBeInTheDocument();
    expect(screen.getByText(text.evening.nothingWasted)).toBeInTheDocument();
  });

  it('closes with the Done button', async () => {
    const dispatch = report({}, { day: 3 });
    expect(screen.getByRole('dialog', { name: 'Day 3 is done!' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: text.evening.done }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'closePanel' });
  });
});
