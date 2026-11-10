import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, expectNoHorizontalScroll, startNewGame } from './helpers';

test.describe('title and new game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and shows the game title', async ({ page }) => {
    await expect(page).toHaveTitle('Bakery Simulator');
    await expect(page.getByRole('heading', { level: 1, name: 'Bakery Simulator' })).toBeVisible();
  });

  test('start button is a large touch target and opens the save slots', async ({ page }) => {
    const start = page.getByTestId('start-button');
    await expect(start).toBeVisible();

    const box = await start.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);

    await start.click();
    await expect(page.getByRole('heading', { name: 'Your bakeries' })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);

    await page.getByTestId('slot-1-new').click();
    await expect(page.getByRole('heading', { name: 'Your new bakery' })).toBeVisible();
  });

  test('title screen has no horizontal scrolling and passes accessibility checks', async ({
    page,
  }) => {
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);
  });

  test('new game form offers default names and passes accessibility checks', async ({ page }) => {
    await page.getByTestId('start-button').click();
    await page.getByTestId('slot-1-new').click();
    await expect(page.getByTestId('bakery-name-input')).toHaveValue('Sunny Bakery');
    await expect(page.getByTestId('player-name-input')).toHaveValue('Sam');
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);
  });

  test('the names the player picks appear on the shop sign and the greeting', async ({ page }) => {
    await startNewGame(page, { bakery: 'Bun Fun', player: 'Ada' });
    await expect(page.getByTestId('bakery-name')).toContainText('Bun Fun');
    await expect(page.getByTestId('message')).toContainText('Good morning, Ada!');
    await expect(page.getByRole('img', { name: 'Ada, the baker' })).toBeVisible();
  });

  test('the look the player picks is the baker in the world', async ({ page }) => {
    await page.getByTestId('start-button').click();
    await page.getByTestId('slot-1-new').click();
    const look = page.getByTestId('look-baker-3');
    await look.click();
    await expect(look.getByRole('radio')).toBeChecked();
    const face = (await look.textContent()) ?? '';
    expect(face.trim()).not.toBe('');
    await expectNoA11yViolations(page);

    await page.getByTestId('open-bakery-button').click();
    await expect(page.getByTestId('baker')).toHaveText(face);
  });

  test('a very long name is cut to the limit and does not break the layout', async ({ page }) => {
    await startNewGame(page, { bakery: 'W'.repeat(40), player: 'M'.repeat(40) });
    await expect(page.getByTestId('bakery-name')).toContainText('W'.repeat(20));
    await expect(page.getByTestId('bakery-name')).not.toContainText('W'.repeat(21));
    await expectNoHorizontalScroll(page);
  });
});
