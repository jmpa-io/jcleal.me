import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { ensureScheme } from './helpers/palette-helpers';

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

const PAIRS = { 'teal-pink': ['#008080', '#ff69b4'], 'near-white': ['#fffde0', '#ffffff'] } as const;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('home light', async ({ page }) => {
  await ensureScheme(page, 'light');
  await shot(page, 'home-light', { fullPage: true });
});

test('home dark', async ({ page }) => {
  await ensureScheme(page, 'dark');
  await shot(page, 'home-dark', { fullPage: true });
});

for (const [name, [p, s]] of Object.entries(PAIRS)) {
  for (const scheme of ['light', 'dark']) {
    test(`${name} page (${scheme})`, async ({ page }) => {
      await ensureScheme(page, scheme as 'light' | 'dark');
      await page.evaluate(([p, s]) => (window as any).Palette.set({ primary: p, secondary: s }), [p, s]);
      await shot(page, `page-${name}-${scheme}`, { fullPage: true });
    });
    test(`${name} popup (${scheme})`, async ({ page }) => {
      await ensureScheme(page, scheme as 'light' | 'dark');
      await popup(page);
      await fill(page, '#jc-custom-primary', p);
      await fill(page, '#jc-custom-secondary', s);
      await shot(page, `popup-${name}-${scheme}`);
    });
  }
}

test('popup default', async ({ page }) => {
  await popup(page);
  await shot(page, 'popup-default');
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
