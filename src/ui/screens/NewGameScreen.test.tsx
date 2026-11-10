import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../content/balance';
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
