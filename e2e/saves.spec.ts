import { expect, test } from '@playwright/test';
import {
  buyOne,
  expectHealthyPage,
  expectPhase,
  expectPlace,
  putSave,
  quickShopDay,
  saveAndLeave,
  startNewGame,
  tapThing,
  walkThrough,
} from './helpers';
import { lastChance } from './saves';

test('save, reload the page, continue', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page, { bakery: 'Bun Fun', player: 'Ada', slot: 2 });

  // Shop for one egg, then open the shop. Opening is the end of the morning, so the game saves.
  await walkThrough(page, 'door', 'street');
  await walkThrough(page, 'market', 'market');
  await buyOne(page, 'egg');
  await walkThrough(page, 'exit', 'street');
  await walkThrough(page, 'bakery', 'bakery');
  await tapThing(page, 'sign');
  await tapThing(page, 'sign');
  await expectPhase(page, 'open');

  // Reloading with the shop open starts that day's morning again, with the shopping kept.
  await page.reload();
  await expect(page.getByTestId('start-button')).toBeVisible();
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('slot-2-name')).toHaveText('Bun Fun');
  await expect(page.getByTestId('slot-2-summary')).toHaveText('Day 1 · $59.00 · Medium');
  await expect(page.getByTestId('slot-1')).toHaveAttribute('data-status', 'empty');
  await expectHealthyPage(page);
  await page.getByTestId('slot-2-continue').click();
  await expectPlace(page, 'home');
  await expectPhase(page, 'morning');
  await expect(page.getByTestId('money')).toHaveText('$59.00');
  await expect(page.getByTestId('bakery-name')).toContainText('Bun Fun');

  // Play to the evening and count the till: that saves too.
  await walkThrough(page, 'door', 'street');
  await walkThrough(page, 'bakery', 'bakery');
  await quickShopDay(page);
  await page.reload();
  await page.getByTestId('start-button').click();
  await page.getByTestId('slot-2-continue').click();
  await expectPhase(page, 'evening');
  await expectPlace(page, 'bakery');

  // The till was counted before the reload, so the baker may go home to bed.
  await walkThrough(page, 'door', 'street');
  await walkThrough(page, 'home', 'home');
  await tapThing(page, 'bed');
  await expect(page.getByTestId('day')).toHaveText('Day 2');

  // Leaving from the menu in the morning saves on the spot.
  await walkThrough(page, 'door', 'street');
  await page.getByTestId('menu-button').click();
  await expect(page.getByTestId('pause-dialog')).toBeVisible();
  await expectHealthyPage(page);
  await page.getByTestId('quit-button').click();
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('slot-2-summary')).toHaveText('Day 2 · $59.00 · Medium');
  await page.getByTestId('slot-2-continue').click();
  await expectPlace(page, 'street');
});

test('three slots stay separate, and one can be deleted', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page, { bakery: 'One', slot: 1, difficulty: 'easy' });
  await saveAndLeave(page);
  await startNewGame(page, { bakery: 'Two', slot: 2 });
  await walkThrough(page, 'door', 'street');
  await walkThrough(page, 'market', 'market');
  await buyOne(page, 'flour');
  await saveAndLeave(page);
  await startNewGame(page, { bakery: 'Three', slot: 3, difficulty: 'hard' });
  await saveAndLeave(page);

  await page.reload();
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('slot-1-name')).toHaveText('One');
  await expect(page.getByTestId('slot-1-summary')).toHaveText('Day 1 · $100.00 · Easy');
  await expect(page.getByTestId('slot-2-name')).toHaveText('Two');
  await expect(page.getByTestId('slot-2-summary')).toHaveText('Day 1 · $59.00 · Medium');
  await expect(page.getByTestId('slot-3-name')).toHaveText('Three');
  await expect(page.getByTestId('slot-3-summary')).toHaveText('Day 1 · $40.00 · Hard');
  await expectHealthyPage(page);

  // Each slot opens its own game.
  await page.getByTestId('slot-2-continue').click();
  await expect(page.getByTestId('bakery-name')).toContainText('Two');
  await expectPlace(page, 'market');
  await saveAndLeave(page);

  // Deleting asks first. "No" keeps the save.
  await page.getByTestId('start-button').click();
  await page.getByTestId('slot-2-delete').click();
  await expect(page.getByTestId('delete-dialog')).toBeVisible();
  await expect(page.getByTestId('delete-cancel')).toBeFocused();
  await expectHealthyPage(page);
  await page.getByTestId('delete-cancel').click();
  await expect(page.getByTestId('slot-2-name')).toHaveText('Two');

  // "Yes" deletes that slot only, and it stays deleted after a reload.
  await page.getByTestId('slot-2-delete').click();
  await page.getByTestId('delete-confirm').click();
  await expect(page.getByTestId('slot-2')).toHaveAttribute('data-status', 'empty');
  await page.reload();
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('slot-1-name')).toHaveText('One');
  await expect(page.getByTestId('slot-2')).toHaveAttribute('data-status', 'empty');
  await expect(page.getByTestId('slot-3-name')).toHaveText('Three');
});

test('a broken save is reported kindly and can be cleared', async ({ page }) => {
  await putSave(page, 1, { version: 1, game: { money: 'lots' } });
  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('slot-1-damaged')).toHaveText(
    'Sorry, this save is broken and cannot be opened.',
  );
  await expect(page.getByTestId('slot-1-continue')).toHaveCount(0);
  await expectHealthyPage(page);

  await page.getByTestId('slot-1-delete').click();
  await page.getByTestId('delete-confirm').click();
  await page.getByTestId('slot-1-new').click();
  await expect(page.getByRole('heading', { name: 'Your new bakery' })).toBeVisible();
});

test('the game keeps running when nothing can be stored', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    };
  });
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page);
  await expect(page.getByTestId('save-warning')).toHaveText(
    'Your game could not be saved on this device. You can keep playing.',
  );
  await expectHealthyPage(page);
  await walkThrough(page, 'door', 'street');
  await expectPlace(page, 'street');
});

test('a Hard run that ends offers the day again', async ({ page }) => {
  await putSave(page, 1, lastChance());
  await page.goto('/?speed=5');
  await page.getByTestId('start-button').click();
  await page.getByTestId('slot-1-continue').click();
  await expectPhase(page, 'evening');

  // No money for the third repayment in a row: the bank closes the bakery.
  await tapThing(page, 'till');
  await expect(page.getByTestId('game-over-dialog')).toBeVisible();
  await expect(page.getByTestId('game-over-dialog')).toContainText('You missed 3 loan payments');
  await expectHealthyPage(page);

  await page.getByTestId('retry-day-button').click();
  await expect(page.getByTestId('game-over-dialog')).toBeHidden();
  await expectPhase(page, 'morning');
  await expectPlace(page, 'home');
  await expect(page.getByTestId('day')).toHaveText('Day 4');
  await expect(page.getByTestId('money')).toHaveText('$20.00');
});
