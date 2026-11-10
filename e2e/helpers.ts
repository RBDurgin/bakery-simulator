import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export type PlaceName = 'home' | 'street' | 'market' | 'bakery';

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

/** Both checks every place and panel must pass. */
export async function expectHealthyPage(page: Page) {
  await expectNoHorizontalScroll(page);
  await expectNoA11yViolations(page);
}

export async function expectPlace(page: Page, place: PlaceName) {
  await expect(page.getByTestId('world')).toHaveAttribute('data-place', place);
}

export async function expectPhase(page: Page, phase: 'morning' | 'open' | 'evening') {
  await expect(page.getByTestId('world')).toHaveAttribute('data-phase', phase);
}

/** Starts a new game from the title screen and lands at home on the first morning. */
export async function startNewGame(page: Page, names?: { bakery: string; player: string }) {
  await page.getByTestId('start-button').click();
  if (names) {
    await page.getByTestId('bakery-name-input').fill(names.bakery);
    await page.getByTestId('player-name-input').fill(names.player);
  }
  await page.getByTestId('open-bakery-button').click();
  await expectPlace(page, 'home');
  await expectPhase(page, 'morning');
}

/** Taps a thing in the place; the baker walks there. */
export async function tapThing(page: Page, id: string) {
  await page.getByTestId(`thing-${id}`).click();
}

/** Taps a door and waits until the baker has walked through to the next place. */
export async function walkThrough(page: Page, door: string, to: PlaceName) {
  await tapThing(page, door);
  await expectPlace(page, to);
}

/** Walks to a market stall, buys one, and closes the panel. */
export async function buyOne(page: Page, ingredient: string) {
  await tapThing(page, ingredient);
  await page.getByTestId(`buy-${ingredient}`).click();
  await expect(page.getByTestId(`stock-${ingredient}`)).toHaveText('You have 1');
  await page.getByTestId('panel-close').click();
  await expect(page.getByTestId('stall-panel')).toBeHidden();
}

/** Presses Tab until the element with this test id has the focus. */
export async function tabTo(page: Page, testId: string) {
  const target = page.getByTestId(testId);
  for (let presses = 0; presses < 40; presses++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}
