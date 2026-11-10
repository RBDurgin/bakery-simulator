import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, expectNoHorizontalScroll, startNewGame } from './helpers';

/*
 * One whole day with a fixed seed. With seed 42 the first customer of the day
 * wants a muffin (a unit test in src/engine/game.test.ts pins this). The clock
 * runs five times faster so the test is quick.
 */
test('play one full day and see the correct profit', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page, { bakery: 'Bun Fun', player: 'Ada' });

  // Morning: buy the ingredients for one batch of muffins. $1 + $1 + $1 = $3.
  await expect(page.getByTestId('money')).toHaveText('$60.00');
  await expectNoHorizontalScroll(page);
  await expectNoA11yViolations(page);
  for (const ingredient of ['flour', 'sugar', 'egg']) {
    await page.getByTestId(`buy-${ingredient}`).click();
  }
  await expect(page.getByTestId('money')).toHaveText('$57.00');
  await expect(page.getByTestId('batches-muffin')).toHaveText('You can bake 1 batch.');
  await page.getByTestId('open-shop-button').click();

  // Open: bake the muffins and take them out when they are ready.
  await expect(page.getByTestId('open-screen')).toBeVisible();
  await page.getByTestId('bake-muffin').click();
  await page.getByTestId('take-out-button').click();
  await expect(page.getByTestId('shelf-muffin')).toHaveText('4');

  // Serve the first customer one muffin for $2.
  await page.getByTestId('serve-muffin').first().click();
  await expect(page.getByTestId('shelf-muffin')).toHaveText('3');
  await expect(page.getByTestId('money')).toHaveText('$59.00');

  // Pause stops the clock; close the shop from the pause screen.
  await page.getByTestId('pause-button').click();
  await expect(page.getByTestId('pause-dialog')).toBeVisible();
  const timeLeft = await page.getByTestId('time-left').textContent();
  await expectNoHorizontalScroll(page);
  await expectNoA11yViolations(page);
  await expect(page.getByTestId('time-left')).toHaveText(timeLeft ?? '');
  await page.getByTestId('close-shop-button').click();

  // Evening: earned $2, spent $3, so the profit is -$1.
  await expect(page.getByTestId('evening-screen')).toBeVisible();
  await expect(page.getByTestId('report-for')).toHaveText("Ada's report for Bun Fun");
  await expect(page.getByTestId('report-income')).toHaveText('$2.00');
  await expect(page.getByTestId('report-spent')).toHaveText('$3.00');
  await expect(page.getByTestId('report-profit')).toHaveText('-$1.00');
  await expect(page.getByTestId('report-sold')).toContainText('1 Muffin');
  await expect(page.getByTestId('report-wasted')).toContainText('3 Muffins');
  await expect(page.getByTestId('report-happy')).toHaveText('1');
  await expect(page.getByTestId('report-lost')).toHaveText('0');
  await expectNoHorizontalScroll(page);
  await expectNoA11yViolations(page);

  // The next day starts a new morning and keeps the money.
  await page.getByTestId('next-day-button').click();
  await expect(page.getByTestId('morning-screen')).toBeVisible();
  await expect(page.getByTestId('day')).toHaveText('Day 2');
  await expect(page.getByTestId('money')).toHaveText('$59.00');
});

test('the open screen passes accessibility checks while customers wait', async ({ page }) => {
  await page.goto('/?seed=42&speed=5');
  await startNewGame(page);
  await page.getByTestId('open-shop-button').click();
  await expect(page.getByTestId('customer').first()).toBeVisible();
  await page.getByTestId('pause-button').click();
  await page.getByTestId('resume-button').click();
  await expect(page.getByTestId('pause-dialog')).toBeHidden();
  await expectNoHorizontalScroll(page);
  await expectNoA11yViolations(page);
});
