import { expect, test } from '@playwright/test';
import {
  buyOne,
  expectHealthyPage,
  expectPhase,
  expectPlace,
  startNewGame,
  tabTo,
  tapThing,
  walkThrough,
} from './helpers';

/*
 * One whole day in the walkable world, with a fixed seed. With seed 42 the
 * first customer of the day wants a muffin (a unit test in
 * src/engine/game.test.ts pins this). Time runs five times faster so the
 * test is quick.
 */
test('play one full day in the world and see the correct profit', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page, { bakery: 'Bun Fun', player: 'Ada' });

  // Morning, at home. Money, day and stars are in view in every place.
  await expect(page.getByTestId('message')).toHaveText(
    'Good morning, Ada! Tap the door to go out.',
  );
  await expect(page.getByTestId('money')).toHaveText('$60.00');
  await expect(page.getByTestId('time-of-day')).toHaveText(/Morning/);
  await expectHealthyPage(page);

  // Walk out to the street, then to the market.
  await walkThrough(page, 'door', 'street');
  await expect(page.getByTestId('message')).toHaveText('You are on the street.');
  await expectHealthyPage(page);
  await walkThrough(page, 'market', 'market');
  await expectHealthyPage(page);

  // Buy the ingredients for one batch of muffins. $1 + $1 + $1 = $3.
  await tapThing(page, 'flour');
  await expect(page.getByTestId('stall-panel')).toBeVisible();
  await expect(page.getByTestId('panel-money')).toHaveText('$60.00');
  await expectHealthyPage(page);
  await page.getByTestId('panel-close').click();
  for (const ingredient of ['flour', 'sugar', 'egg']) {
    await buyOne(page, ingredient);
  }
  await expect(page.getByTestId('money')).toHaveText('$57.00');
  await tapThing(page, 'egg');
  await expect(page.getByTestId('batches-muffin')).toHaveText('You can bake 1 batch.');
  await page.getByTestId('panel-close').click();

  // Walk to the bakery and turn the sign to open the shop.
  await walkThrough(page, 'exit', 'street');
  await walkThrough(page, 'bakery', 'bakery');
  await expect(page.getByTestId('sign-status')).toHaveText('Closed');
  await expectHealthyPage(page);
  await tapThing(page, 'sign');
  await expectPhase(page, 'open');
  await expect(page.getByTestId('sign-status')).toHaveText('Open');

  // The baker stays in while the shop is open.
  await tapThing(page, 'door');
  await expect(page.getByTestId('message')).toHaveText('The shop is open, so stay inside.');
  await expectPlace(page, 'bakery');

  // Walk to the oven, bake the muffins and take them out when they are ready.
  await tapThing(page, 'oven');
  await expect(page.getByTestId('oven-panel')).toBeVisible();
  await expectHealthyPage(page);
  await page.getByTestId('bake-muffin').click();
  // Fifteen seconds of baking is three real seconds; leave room for a busy machine.
  await expect(page.getByTestId('oven-status')).toHaveAttribute('data-stage', 'ready', {
    timeout: 15_000,
  });
  await tapThing(page, 'oven');
  await expect(page.getByTestId('shelf-muffin')).toHaveText('4');
  await expect(page.getByTestId('message')).toHaveText('4 Muffins are on the shelf.');

  // Serve the first customer one muffin for $2: the baker walks to the counter.
  await page.getByTestId('serve-muffin').first().click();
  await expect(page.getByTestId('shelf-muffin')).toHaveText('3');
  await expect(page.getByTestId('money')).toHaveText('$59.00');
  await expect(page.getByTestId('message')).toHaveText('You sold 1 Muffin for $2.00.');

  // Pause stops the clock; close the shop from the pause screen.
  await page.getByTestId('pause-button').click();
  await expect(page.getByTestId('pause-dialog')).toBeVisible();
  const timeLeft = await page.getByTestId('time-left').textContent();
  await expectHealthyPage(page);
  await expect(page.getByTestId('time-left')).toHaveText(timeLeft ?? '');
  await page.getByTestId('close-shop-button').click();

  // Evening: the till must be counted before going home.
  await expectPhase(page, 'evening');
  await expect(page.getByTestId('message')).toHaveText(
    'Closing time! Tap the till to count your money.',
  );
  await tapThing(page, 'door');
  await expect(page.getByTestId('message')).toHaveText('Count the till before you go home.');
  await expectPlace(page, 'bakery');

  // Counting the till opens the report: earned $2, spent $3, so the profit is -$1.
  await tapThing(page, 'till');
  await expect(page.getByTestId('report-panel')).toBeVisible();
  await expect(page.getByTestId('report-for')).toHaveText("Ada's report for Bun Fun");
  await expect(page.getByTestId('report-income')).toHaveText('$2.00');
  await expect(page.getByTestId('report-spent')).toHaveText('$3.00');
  await expect(page.getByTestId('report-profit')).toHaveText('-$1.00');
  await expect(page.getByTestId('report-sold')).toContainText('1 Muffin');
  await expect(page.getByTestId('report-wasted')).toContainText('3 Muffins');
  await expect(page.getByTestId('report-happy')).toHaveText('1');
  await expect(page.getByTestId('report-lost')).toHaveText('0');
  await expectHealthyPage(page);
  await page.getByTestId('panel-close').click();
  await expect(page.getByTestId('message')).toHaveText('Well done today! Now go home to bed.');

  // Walk home and go to bed: the next day starts a new morning and keeps the money.
  await walkThrough(page, 'door', 'street');
  await walkThrough(page, 'home', 'home');
  await tapThing(page, 'bed');
  await expect(page.getByTestId('day')).toHaveText('Day 2');
  await expectPhase(page, 'morning');
  await expect(page.getByTestId('money')).toHaveText('$59.00');
});

test('the bakery passes accessibility checks while customers wait', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page);
  await walkThrough(page, 'door', 'street');
  await walkThrough(page, 'bakery', 'bakery');

  // With nothing to bake the sign asks first; a second tap opens the shop anyway.
  await tapThing(page, 'sign');
  await expect(page.getByTestId('message')).toContainText('You have nothing to bake.');
  await expectPhase(page, 'morning');
  await tapThing(page, 'sign');
  await expectPhase(page, 'open');

  await expect(page.getByTestId('customer').first()).toBeVisible();
  await page.getByTestId('pause-button').click();
  await page.getByTestId('resume-button').click();
  await expect(page.getByTestId('pause-dialog')).toBeHidden();
  await expectHealthyPage(page);

  // The customer wants something that is not on the shelf.
  await page.getByTestId('customer').first().getByRole('button').click();
  await expect(page.getByTestId('message')).toHaveText(
    /^There is no \w+ on the shelf\. Bake some!$/,
  );
});

test('every tappable thing is a large touch target inside the room', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page);

  const checkThings = async () => {
    const room = await page.getByTestId('scene').boundingBox();
    const things = page.locator('[data-testid^="thing-"]');
    const count = await things.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await things.nth(i).boundingBox();
      const id = await things.nth(i).getAttribute('data-testid');
      expect(box?.width ?? 0, `${id} width`).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0, `${id} height`).toBeGreaterThanOrEqual(44);
      expect(box!.x, `${id} left`).toBeGreaterThanOrEqual(room!.x - 1);
      expect(box!.x + box!.width, `${id} right`).toBeLessThanOrEqual(room!.x + room!.width + 1);
      expect(box!.y, `${id} top`).toBeGreaterThanOrEqual(room!.y - 1);
      expect(box!.y + box!.height, `${id} bottom`).toBeLessThanOrEqual(room!.y + room!.height + 1);
    }
  };

  await checkThings();
  await walkThrough(page, 'door', 'street');
  await checkThings();
  await walkThrough(page, 'market', 'market');
  await checkThings();
  await walkThrough(page, 'exit', 'street');
  await walkThrough(page, 'bakery', 'bakery');
  await checkThings();
});

test('the day can be played with the keyboard alone', async ({ page, browserName }) => {
  // Safari only stops on buttons with Tab when a system setting is on, so
  // Tab order is checked in Chromium.
  test.skip(browserName === 'webkit', 'Tab stops on buttons are a Safari setting');

  await page.goto('/?seed=42&speed=5');
  await page.getByTestId('start-button').focus();
  await page.keyboard.press('Enter');
  await tabTo(page, 'open-bakery-button');
  await page.keyboard.press('Enter');
  await expectPlace(page, 'home');

  const walk = async (thing: string, to: Parameters<typeof expectPlace>[1]) => {
    await tabTo(page, `thing-${thing}`);
    await page.keyboard.press('Enter');
    await expectPlace(page, to);
  };

  // To the market, and buy flour at its stall.
  await walk('door', 'street');
  await walk('market', 'market');
  await tabTo(page, 'thing-flour');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('stall-panel')).toBeFocused();
  await tabTo(page, 'buy-flour');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('stock-flour')).toHaveText('You have 1');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('stall-panel')).toBeHidden();
  // Focus goes back to the stall, so the player keeps their place.
  await expect(page.getByTestId('thing-flour')).toBeFocused();

  // To the bakery. Flour alone bakes nothing, so the sign asks before opening.
  await walk('exit', 'street');
  await walk('bakery', 'bakery');
  await tabTo(page, 'thing-sign');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('message')).toContainText('You have nothing to bake.');
  await page.keyboard.press('Enter');
  await expectPhase(page, 'open');

  // Pause, and close the shop from the pause screen.
  await tabTo(page, 'pause-button');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('resume-button')).toBeFocused();
  await tabTo(page, 'close-shop-button');
  await page.keyboard.press('Enter');
  await expectPhase(page, 'evening');

  // Count the till, read the report, walk home and go to bed.
  await tabTo(page, 'thing-till');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('report-panel')).toBeFocused();
  await expect(page.getByTestId('report-spent')).toHaveText('$1.00');
  await tabTo(page, 'panel-close');
  await page.keyboard.press('Enter');
  await walk('door', 'street');
  await walk('home', 'home');
  await tabTo(page, 'thing-bed');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('day')).toHaveText('Day 2');
});
