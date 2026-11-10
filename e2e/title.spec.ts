import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('title screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and shows the game title', async ({ page }) => {
    await expect(page).toHaveTitle('Bakery Simulator');
    await expect(page.getByRole('heading', { level: 1, name: 'Bakery Simulator' })).toBeVisible();
  });

  test('start button is a large touch target and responds to a tap', async ({ page }) => {
    const start = page.getByTestId('start-button');
    await expect(start).toBeVisible();

    const box = await start.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);

    await start.click();
    await expect(page.getByTestId('coming-soon')).toHaveText(/still being built/);
  });

  test('has no horizontal scrolling', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('passes automated accessibility checks', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
