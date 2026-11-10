import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Starts a new game from the title screen and lands on the first morning. */
export async function startNewGame(page: Page, names?: { bakery: string; player: string }) {
  await page.getByTestId('start-button').click();
  if (names) {
    await page.getByTestId('bakery-name-input').fill(names.bakery);
    await page.getByTestId('player-name-input').fill(names.player);
  }
  await page.getByTestId('open-bakery-button').click();
  await expect(page.getByTestId('morning-screen')).toBeVisible();
}
