import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BALANCE } from '../../content/balance';
import { PLACES, PLACE_IDS } from '../../content/places';
import { RECIPES } from '../../content/recipes';
import { at, customer, newGame, openGame, tapThing } from '../../test/fixtures';
import { tick } from '../../engine/game';
import { Scene } from './Scene';

describe('Scene', () => {
  it.each(PLACE_IDS)('draws every thing in the %s as a named button', (placeId) => {
    const place = PLACES[placeId];
    const spot = Object.keys(place.spots)[0] as string;
    render(<Scene game={newGame(at(placeId, spot))} dispatch={vi.fn()} />);

    expect(screen.getByRole('region', { name: new RegExp(`^${place.name}\\.`) })).toHaveAttribute(
      'data-place',
      placeId,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(place.things.length);
    for (const thing of place.things) {
      expect(screen.getByTestId(`thing-${thing.id}`)).toHaveAccessibleName(
        new RegExp(`^${thing.name}`),
      );
    }
  });

  it('tapping a thing asks the engine to walk there', async () => {
    const dispatch = vi.fn();
    render(<Scene game={newGame()} dispatch={dispatch} />);
    await userEvent.click(screen.getByRole('button', { name: 'Street' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'tap', target: { kind: 'thing', id: 'door' } });
  });

  it('shows the baker by name, with the look the player picked, where they stand', () => {
    const game = newGame({ ...at('bakery', 'oven'), playerName: 'Ada', bakerLook: 'baker-3' });
    render(<Scene game={game} dispatch={vi.fn()} />);
    const baker = screen.getByRole('img', { name: 'Ada, the baker' });
    expect(baker).toHaveTextContent('👨🏿‍🍳');
    expect(baker).toHaveStyle({ left: '18%', top: '46%' });
    expect(baker).toHaveAttribute('data-walking', 'false');
  });

  it('moves the baker along the path while walking', () => {
    const walking = tick(tapThing(newGame(at('bakery', 'oven')), 'shelf'), 260);
    render(<Scene game={walking} dispatch={vi.fn()} />);
    const baker = screen.getByTestId('baker');
    expect(baker).toHaveStyle({ left: '31%', top: '46%' });
    expect(baker).toHaveAttribute('data-walking', 'true');
  });

  it('shows prices on the market stalls, and the stall keepers', () => {
    const { container } = render(<Scene game={newGame(at('market', 'exit'))} dispatch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Butter $2.00 each' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eggs $1.00 each' })).toBeInTheDocument();
    expect(container).toHaveTextContent('🧑‍🌾');
  });

  it('shows which way the sign is turned', () => {
    const { rerender } = render(<Scene game={newGame(at('bakery', 'door'))} dispatch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Sign Closed' })).toBeInTheDocument();
    rerender(<Scene game={openGame()} dispatch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Sign Open' })).toBeInTheDocument();
  });

  it('shows what is on the shelf', () => {
    render(
      <Scene game={openGame({ shelf: { cookie: 2, muffin: 0, bread: 5 } })} dispatch={vi.fn()} />,
    );
    expect(screen.getByTestId('shelf-cookie')).toHaveTextContent('2');
    expect(screen.getByTestId('shelf-bread')).toHaveTextContent('5');
    expect(screen.getByTestId('thing-shelf')).toHaveAccessibleName(
      'Shelf Cookies: 2 Muffins: 0 Bread: 5',
    );
  });

  it.each([
    ['empty', { status: 'empty' } as const, 'Empty'],
    ['baking', { status: 'baking', recipeId: 'bread', elapsedMs: 5000 } as const, 'Baking Bread'],
    [
      'ready',
      { status: 'baking', recipeId: 'cookie', elapsedMs: RECIPES.cookie.bakeMs } as const,
      'Cookies ready!',
    ],
    [
      'burnt',
      {
        status: 'baking',
        recipeId: 'cookie',
        elapsedMs: RECIPES.cookie.bakeMs + BALANCE.burnWindowMs,
      } as const,
      'Burnt',
    ],
  ])('shows an oven that is %s', (stage, oven, words) => {
    render(<Scene game={openGame({ oven })} dispatch={vi.fn()} />);
    const status = screen.getByTestId('oven-status');
    expect(status).toHaveAttribute('data-stage', stage);
    expect(status).toHaveTextContent(words);
    const progress = screen.queryByRole('progressbar', { name: 'Baking progress' });
    if (stage === 'baking') expect(progress).toHaveValue(5000);
    else expect(progress).toBeNull();
  });

  it('shows customers in the queue with what they want, and taps serve them', async () => {
    const dispatch = vi.fn();
    const game = openGame({ customers: [customer(7, 'cookie', 1000), customer(8, 'muffin')] });
    render(<Scene game={game} dispatch={dispatch} />);

    const waiting = within(screen.getByRole('list', { name: 'Customers' })).getAllByRole(
      'listitem',
    );
    expect(waiting).toHaveLength(2);
    expect(waiting[0]).toHaveStyle({ left: '46%', top: '87%' });
    expect(waiting[1]).toHaveStyle({ left: '61%' });
    expect(waiting[0]).toHaveTextContent('🍪');

    await userEvent.click(screen.getByRole('button', { name: 'Serve Muffin' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'tap', target: { kind: 'customer', id: 8 } });
  });

  it('shows customers who have just left, as decoration only', () => {
    render(
      <Scene
        game={openGame()}
        dispatch={vi.fn()}
        leaving={[
          { id: 1, queueIndex: 0, mood: 'happy' },
          { id: 2, queueIndex: 1, mood: 'grumpy' },
          { id: 3, queueIndex: 2, mood: 'calm' },
        ]}
      />,
    );
    const leaving = screen.getAllByTestId('leaving-customer');
    expect(leaving.map((el) => el.getAttribute('data-mood'))).toEqual(['happy', 'grumpy', 'calm']);
    expect(leaving[0]).toHaveTextContent('💛');
    expect(leaving[1]).toHaveTextContent('💢');
    for (const el of leaving) expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('has no queue outside the bakery', () => {
    render(<Scene game={newGame()} dispatch={vi.fn()} />);
    expect(screen.queryByRole('list')).toBeNull();
  });
});
