import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { text } from '../../content/text';
import { readSlot, writeSlot } from '../../save/slots';
import { slotKey } from '../../save/storage';
import { useGameStore } from '../../store/gameStore';
import { eveningGame, newGame } from '../../test/fixtures';
import { SlotsScreen } from './SlotsScreen';

const store = () => useGameStore.getState();

function show() {
  store().goTo('slots');
  return render(<SlotsScreen />);
}

function saveBunFun() {
  const game = eveningGame({ bakeryName: 'Bun Fun', day: 3, money: 4250, difficulty: 'hard' });
  writeSlot(2, game, newGame({ bakeryName: 'Bun Fun', day: 3, difficulty: 'hard' }));
}

describe('SlotsScreen', () => {
  it('shows three empty slots, each with a button to start a new bakery', async () => {
    show();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    for (const slot of [1, 2, 3]) {
      expect(screen.getByTestId(`slot-${slot}`)).toHaveAttribute('data-status', 'empty');
    }
    await userEvent.click(screen.getByRole('button', { name: text.slots.newGameLabel(3) }));
    expect(store()).toMatchObject({ screen: 'newGame', slot: 3 });
  });

  it('shows what is in a saved slot and plays it', async () => {
    saveBunFun();
    show();
    const slot = within(screen.getByTestId('slot-2'));
    expect(slot.getByTestId('slot-2-name')).toHaveTextContent('Bun Fun');
    expect(slot.getByTestId('slot-2-summary')).toHaveTextContent('Day 3 · $42.50 · Hard');

    await userEvent.click(screen.getByRole('button', { name: 'Play Bun Fun' }));
    expect(store()).toMatchObject({ screen: 'game', slot: 2 });
    expect(store().game).toMatchObject({ bakeryName: 'Bun Fun', day: 3, phase: 'evening' });
  });

  it('asks before deleting, and keeps the save when the answer is no', async () => {
    saveBunFun();
    show();
    await userEvent.click(screen.getByRole('button', { name: 'Delete Bun Fun' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Delete Bun Fun?' });
    expect(within(dialog).getByRole('button', { name: text.slots.keep })).toHaveFocus();

    await userEvent.click(within(dialog).getByRole('button', { name: text.slots.keep }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(readSlot(2).status).toBe('saved');

    await userEvent.click(screen.getByRole('button', { name: 'Delete Bun Fun' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(readSlot(2).status).toBe('saved');
  });

  it('deletes the save when the answer is yes', async () => {
    saveBunFun();
    show();
    await userEvent.click(screen.getByRole('button', { name: 'Delete Bun Fun' }));
    await userEvent.click(screen.getByRole('button', { name: text.slots.confirmDelete }));
    expect(readSlot(2).status).toBe('empty');
    expect(screen.getByTestId('slot-2')).toHaveAttribute('data-status', 'empty');
  });

  it('says kindly when a save is broken, and lets it be deleted', async () => {
    window.localStorage.setItem(slotKey(1), '{broken');
    show();
    expect(screen.getByTestId('slot-1-damaged')).toHaveTextContent(text.slots.damaged);
    expect(within(screen.getByTestId('slot-1')).queryByRole('button', { name: /Play/ })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Save 1' }));
    expect(
      screen.getByRole('alertdialog', { name: 'Delete the broken save?' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: text.slots.confirmDelete }));
    expect(screen.getByTestId('slot-1')).toHaveAttribute('data-status', 'empty');
  });

  it('goes back to the title', async () => {
    show();
    await userEvent.click(screen.getByRole('button', { name: text.slots.back }));
    expect(store().screen).toBe('title');
  });
});
