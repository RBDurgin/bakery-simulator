import { expect, test, type Page } from '@playwright/test';
import { expectPlace, putSave, startNewGame, tapThing, walkThrough } from './helpers';
import { goodEvening } from './saves';

/*
 * Screenshots of the key screens, at phone and desktop sizes. The baselines
 * in e2e/__screenshots__ are made on CI (fonts and emoji differ between
 * machines), by the "Visual baselines" workflow. See the README.
 *
 * Only screens where nothing moves are checked: the shop clock is never
 * running in a screenshot.
 */
async function shot(page: Page, name: string) {
  // The baker has stopped walking and every panel has finished sliding in.
  await expect(page.locator('[data-walking="true"]')).toHaveCount(0);
  await expect(page).toHaveScreenshot(`${name}.png`, { maxDiffPixelRatio: 0.01 });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('title, settings, save slots and the new game form', async ({ page }) => {
  await putSave(page, 2, goodEvening());
  await page.goto('/');
  await shot(page, 'title');

  await page.getByTestId('title-settings-button').click();
  await shot(page, 'settings');
  await page.getByTestId('panel-close').click();

  await page.getByTestId('start-button').click();
  await shot(page, 'slots');

  await page.getByTestId('slot-2-delete').click();
  await shot(page, 'delete-save');
  await page.getByTestId('delete-cancel').click();

  await page.getByTestId('slot-1-new').click();
  await shot(page, 'new-game');
});

test('the places of the world in the morning', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page, { bakery: 'Bun Fun', player: 'Ada' });
  await shot(page, 'home');

  await page.getByTestId('menu-button').click();
  await shot(page, 'menu');
  await page.getByTestId('resume-button').click();

  await walkThrough(page, 'door', 'street');
  await shot(page, 'street');

  await walkThrough(page, 'market', 'market');
  await shot(page, 'market');
  await tapThing(page, 'flour');
  await expect(page.getByTestId('stall-panel')).toBeVisible();
  await shot(page, 'stall');
  await page.getByTestId('panel-close').click();

  await walkThrough(page, 'exit', 'street');
  await walkThrough(page, 'bakery', 'bakery');
  await shot(page, 'bakery');
});

test('the evening report', async ({ page }) => {
  await putSave(page, 1, goodEvening());
  await page.goto('/?speed=5');
  await page.getByTestId('start-button').click();
  await page.getByTestId('slot-1-continue').click();
  await expectPlace(page, 'bakery');
  await tapThing(page, 'till');
  await expect(page.getByTestId('report-panel')).toBeVisible();
  await shot(page, 'report');
});
