import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../content/balance';
import { BAKER_LOOKS } from '../../content/looks';
import { text } from '../../content/text';
import { DEFAULT_BAKERY_NAME, DEFAULT_PLAYER_NAME } from '../../engine/state';
import { useGameStore } from '../../store/gameStore';
import { NewGameScreen } from './NewGameScreen';

const bakeryInput = () => screen.getByRole('textbox', { name: text.newGame.bakeryNameLabel });
const playerInput = () => screen.getByRole('textbox', { name: text.newGame.playerNameLabel });
const submit = () => userEvent.click(screen.getByRole('button', { name: text.newGame.submit }));

describe('NewGameScreen', () => {
  it('offers friendly default names', async () => {
    render(<NewGameScreen />);
    expect(bakeryInput()).toHaveValue(DEFAULT_BAKERY_NAME);
    expect(playerInput()).toHaveValue(DEFAULT_PLAYER_NAME);

    await submit();
    expect(useGameStore.getState().game).toMatchObject({
      bakeryName: DEFAULT_BAKERY_NAME,
      playerName: DEFAULT_PLAYER_NAME,
      bakerLook: 'baker-1',
    });
  });

  it('starts a game with the names the player typed', async () => {
    render(<NewGameScreen />);
    await userEvent.clear(bakeryInput());
    await userEvent.type(bakeryInput(), 'Bun Fun');
    await userEvent.clear(playerInput());
    await userEvent.type(playerInput(), 'Ada{Enter}');

    expect(useGameStore.getState().screen).toBe('game');
    expect(useGameStore.getState().game).toMatchObject({
      bakeryName: 'Bun Fun',
      playerName: 'Ada',
    });
  });

  it('lets the player pick a look for their baker', async () => {
    render(<NewGameScreen />);
    const looks = screen.getAllByRole('radio');
    expect(looks).toHaveLength(BAKER_LOOKS.length);
    expect(screen.getByRole('radio', { name: 'Baker look 1' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Baker look 4' }));
    expect(screen.getByRole('radio', { name: 'Baker look 4' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Baker look 1' })).not.toBeChecked();

    await submit();
    expect(useGameStore.getState().game?.bakerLook).toBe('baker-4');
  });

  it('limits how long a name can be', async () => {
    render(<NewGameScreen />);
    await userEvent.clear(bakeryInput());
    await userEvent.type(bakeryInput(), 'x'.repeat(BALANCE.nameMaxLength + 10));
    expect(bakeryInput()).toHaveValue('x'.repeat(BALANCE.nameMaxLength));
  });

  it('falls back to the defaults when a name is left empty', async () => {
    render(<NewGameScreen />);
    await userEvent.clear(bakeryInput());
    await userEvent.clear(playerInput());
    await submit();
    expect(useGameStore.getState().game).toMatchObject({
      bakeryName: DEFAULT_BAKERY_NAME,
      playerName: DEFAULT_PLAYER_NAME,
    });
  });
});
