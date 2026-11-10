import { expect, test } from '@playwright/test';
import {
  expectHealthyPage,
  expectPhase,
  expectPlace,
  putSave,
  quickShopDay,
  tapThing,
  walkThrough,
  type DifficultyName,
} from './helpers';
import { brokeAtBedtime } from './saves';

const MODES: { id: DifficultyName; name: string; money: string; helped: RegExp }[] = [
  { id: 'easy', name: 'Easy', money: '$100.00', helped: /Grandma sent you \$20\.00/ },
  {
    id: 'medium',
    name: 'Medium',
    money: '$60.00',
    helped: /The bank lent you \$20\.00\. You owe \$20\.00/,
  },
  {
    id: 'hard',
    name: 'Hard',
    money: '$40.00',
    helped: /The bank lent you \$20\.00\. You owe \$25\.00/,
  },
];

for (const mode of MODES) {
  test(`one day on ${mode.name}`, async ({ page }) => {
    await page.goto('/?seed=42&speed=5');
    await page.getByTestId('start-button').click();
    await page.getByTestId('slot-1-new').click();
    await page.getByTestId(`difficulty-${mode.id}`).click();
    await expect(page.getByTestId(`difficulty-${mode.id}`).getByRole('radio')).toBeChecked();
    await expectHealthyPage(page);
    await page.getByTestId('open-bakery-button').click();
    await expect(page.getByTestId('money')).toHaveText(mode.money);

    // A whole day: to the bakery, open, close, count the till, home to bed.
    await walkThrough(page, 'door', 'street');
    await walkThrough(page, 'bakery', 'bakery');
    await quickShopDay(page);
    await expect(page.getByTestId('report-profit')).toHaveText('$0.00');
    await expect(page.getByTestId('report-loan')).toHaveCount(0);
    await page.getByTestId('panel-close').click();
    await walkThrough(page, 'door', 'street');
    await walkThrough(page, 'home', 'home');
    await tapThing(page, 'bed');
    await expect(page.getByTestId('day')).toHaveText('Day 2');
    await expect(page.getByTestId('money')).toHaveText(mode.money);

    // The mode is remembered with the save.
    await page.getByTestId('menu-button').click();
    await page.getByTestId('quit-button').click();
    await page.getByTestId('start-button').click();
    await expect(page.getByTestId('slot-1-summary')).toHaveText(
      `Day 2 · ${mode.money} · ${mode.name}`,
    );
  });

  test(`running out of money on ${mode.name}`, async ({ page }) => {
    await putSave(page, 1, brokeAtBedtime(mode.id));
    await page.goto('/?speed=5');
    await page.getByTestId('start-button').click();
    await page.getByTestId('slot-1-continue').click();
    await expectPlace(page, 'home');
    await expect(page.getByTestId('money')).toHaveText('$0.00');

    await tapThing(page, 'bed');
    await expect(page.getByTestId('day')).toHaveText('Day 3');
    await expectPhase(page, 'morning');
    await expect(page.getByTestId('money')).toHaveText('$20.00');
    await expect(page.getByTestId('message')).toHaveText(mode.helped);
    await expectHealthyPage(page);
  });
}

test('a loan is paid back a little each evening', async ({ page }) => {
  await putSave(page, 1, brokeAtBedtime('hard'));
  await page.goto('/?speed=5');
  await page.getByTestId('start-button').click();
  await page.getByTestId('slot-1-continue').click();
  await tapThing(page, 'bed');
  await expect(page.getByTestId('money')).toHaveText('$20.00');

  await walkThrough(page, 'door', 'street');
  await walkThrough(page, 'bakery', 'bakery');
  await quickShopDay(page);
  await expect(page.getByTestId('report-repaid')).toHaveText('$5.00');
  await expect(page.getByTestId('report-owed')).toHaveText('$20.00');
  await expect(page.getByTestId('report-profit')).toHaveText('$0.00');
  await expectHealthyPage(page);
  await page.getByTestId('panel-close').click();
  await expect(page.getByTestId('money')).toHaveText('$15.00');
});
