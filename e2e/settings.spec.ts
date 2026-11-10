import { expect, test } from '@playwright/test';
import { expectHealthyPage, startNewGame, tapThing, walkThrough } from './helpers';

const root = (page: import('@playwright/test').Page) => page.locator('html');

test('settings are kept apart from saves and survive a reload', async ({ page }) => {
  await page.goto('/');
  await expect(root(page)).toHaveAttribute('data-text-size', 'normal');
  await expect(root(page)).toHaveAttribute('data-motion', 'full');

  await page.getByTestId('title-settings-button').click();
  await expect(page.getByTestId('settings-panel')).toBeVisible();
  await expect(page.getByTestId('setting-sound')).toBeChecked();
  await expectHealthyPage(page);

  const before = await page.getByTestId('settings-panel').getByRole('heading').boundingBox();
  await page.getByTestId('text-size-larger').click();
  await page.getByTestId('setting-motion').check();
  await page.getByTestId('setting-sound').uncheck();
  await expect(root(page)).toHaveAttribute('data-text-size', 'larger');
  await expect(root(page)).toHaveAttribute('data-motion', 'reduced');
  const after = await page.getByTestId('settings-panel').getByRole('heading').boundingBox();
  expect(after!.height).toBeGreaterThan(before!.height);
  await expectHealthyPage(page);
  await page.getByTestId('panel-close').click();

  // No save slot was touched.
  await page.reload();
  await expect(root(page)).toHaveAttribute('data-text-size', 'larger');
  await expect(root(page)).toHaveAttribute('data-motion', 'reduced');
  await page.getByTestId('title-settings-button').click();
  await expect(page.getByTestId('setting-sound')).not.toBeChecked();
  await expect(page.getByTestId('setting-motion')).toBeChecked();
  await page.getByTestId('panel-close').click();
  await page.getByTestId('start-button').click();
  for (const slot of [1, 2, 3]) {
    await expect(page.getByTestId(`slot-${slot}`)).toHaveAttribute('data-status', 'empty');
  }
});

test('less movement follows the device until the player chooses', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(root(page)).toHaveAttribute('data-motion', 'reduced');
  await page.getByTestId('title-settings-button').click();
  await expect(page.getByTestId('setting-motion')).toBeChecked();
  await page.getByTestId('setting-motion').uncheck();
  await expect(root(page)).toHaveAttribute('data-motion', 'full');
});

test('the game fits the screen with the biggest text', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await page.getByTestId('title-settings-button').click();
  await page.getByTestId('text-size-larger').click();
  await page.getByTestId('panel-close').click();
  await expectHealthyPage(page);

  await page.getByTestId('start-button').click();
  await expectHealthyPage(page);
  await page.getByTestId('slot-1-new').click();
  await expectHealthyPage(page);
  await page.getByTestId('open-bakery-button').click();
  await expectHealthyPage(page);
  await walkThrough(page, 'door', 'street');
  await walkThrough(page, 'market', 'market');
  await expectHealthyPage(page);
  await tapThing(page, 'flour');
  await expect(page.getByTestId('stall-panel')).toBeVisible();
  await expectHealthyPage(page);
  await page.getByTestId('panel-close').click();
  await walkThrough(page, 'exit', 'street');
  await walkThrough(page, 'bakery', 'bakery');
  await expectHealthyPage(page);
});

test('settings can be changed from the menu in the game', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page);
  await page.getByTestId('menu-button').click();
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('settings-panel')).toBeVisible();
  await page.getByTestId('text-size-large').click();
  await expect(root(page)).toHaveAttribute('data-text-size', 'large');
  await page.getByTestId('panel-close').click();
  await expect(page.getByTestId('pause-dialog')).toBeVisible();
  await page.getByTestId('resume-button').click();
  await expect(page.getByTestId('pause-dialog')).toBeHidden();
});
