import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const fill = (page: Page, sel: string, value: string) =>
  page.locator(sel).evaluate((el: HTMLInputElement, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);

const popup = async (page: Page) => {
  await page.locator('#jc-palette-trigger').click();
  await expect(page.locator('#jc-palette-popup')).toHaveClass(/open/);
};

const shot = (page: Page, name: string, opts = {}) => expect(page).toHaveScreenshot(`${name}.png`, opts);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('home light', ({ page }) => shot(page, 'home-light', { fullPage: true }));

test('home dark', async ({ page }) => {
  await page.locator('#scheme-toggle').click();
  await shot(page, 'home-dark', { fullPage: true });
});

for (const scheme of ['light', 'dark']) {
  test(`popup with custom colours (${scheme})`, async ({ page }) => {
    if (scheme === 'dark') await page.locator('#scheme-toggle').click();
    await popup(page);
    await fill(page, '#jc-custom-primary', '#118833');
    await fill(page, '#jc-custom-secondary', '#aa22cc');
    await shot(page, `popup-custom-${scheme}`);
  });
}

test('preset selected', async ({ page }) => {
  await popup(page);
  await page.locator('.jc-palette-btn[data-palette="forest"]').click();
  await popup(page);
  await shot(page, 'preset-forest');
});

test('footer', async ({ page }) => {
  await expect(page.locator('.footer')).toHaveScreenshot('footer.png');
});

test('mobile popup', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile');
  await popup(page);
  await fill(page, '#jc-custom-primary', '#fffde0');
  await shot(page, 'popup-mobile');
});
