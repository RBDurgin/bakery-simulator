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

export type DifficultyName = 'easy' | 'medium' | 'hard';

interface NewGameChoices {
  bakery?: string;
  player?: string;
  /** The save slot to start in. Slot 1 unless told otherwise. */
  slot?: 1 | 2 | 3;
  difficulty?: DifficultyName;
}

/** Starts a new game from the title screen and lands at home on the first morning. */
export async function startNewGame(page: Page, choices: NewGameChoices = {}) {
  await page.getByTestId('start-button').click();
  await page.getByTestId(`slot-${choices.slot ?? 1}-new`).click();
  if (choices.bakery) await page.getByTestId('bakery-name-input').fill(choices.bakery);
  if (choices.player) await page.getByTestId('player-name-input').fill(choices.player);
  if (choices.difficulty) await page.getByTestId(`difficulty-${choices.difficulty}`).click();
  await page.getByTestId('open-bakery-button').click();
  await expectPlace(page, 'home');
  await expectPhase(page, 'morning');
}

/** Leaves the game from the menu, outside shop hours, and lands on the title screen. */
export async function saveAndLeave(page: Page) {
  await page.getByTestId('menu-button').click();
  await page.getByTestId('quit-button').click();
  await expect(page.getByTestId('start-button')).toBeVisible();
}

/**
 * Opens the shop with nothing to bake, closes it from the pause screen and
 * counts the till: the quickest way through a day. Starts in the bakery.
 */
export async function quickShopDay(page: Page) {
  await tapThing(page, 'sign');
  await expect(page.getByTestId('message')).toContainText('You have nothing to bake.');
  await tapThing(page, 'sign');
  await expectPhase(page, 'open');
  await page.getByTestId('pause-button').click();
  await page.getByTestId('close-shop-button').click();
  await expectPhase(page, 'evening');
  await tapThing(page, 'till');
  await expect(page.getByTestId('report-panel')).toBeVisible();
}

/** Puts a prepared save into a slot before the page loads. See e2e/saves.ts. */
export async function putSave(page: Page, slot: 1 | 2 | 3, save: unknown) {
  await page.addInitScript(
    ([key, value]) => {
      // Only the first load: a reload must keep what the game saved since.
      if (window.sessionStorage.getItem(`put:${key}`)) return;
      window.sessionStorage.setItem(`put:${key}`, 'yes');
      window.localStorage.setItem(key as string, value as string);
    },
    [`bakery-simulator.save.${slot}`, JSON.stringify(save)],
  );
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
