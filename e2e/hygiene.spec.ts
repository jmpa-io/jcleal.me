import { test, expect, external } from './fixtures';

const PAGES = ['/', '/resume/', '/workshops/', '/posts/', '/posts/my-caricatures/', '/contact/', '/tags/', '/tags/bash/', '/docker-101/part-1/', '/404.html'];

// Guards what lets the CloudFront CSP (script-src 'self', no third-party origins) keep working, plus the basics of a valid document.
for (const path of PAGES) {
  test(`${path}: valid <html lang>, same-origin only, no inline scripts`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', /^[a-z]{2}(-[A-Za-z]{2})?$/);
    expect(await page.evaluate(() => document.querySelectorAll('htmlclass').length)).toBe(0);
    expect(await page.evaluate(() => [...document.querySelectorAll('script:not([src])')].length)).toBe(0);
    expect(external(page)).toEqual([]);
  });
}

test('404 page explains itself and links home', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('h1.title')).toHaveText('Page not found');
  await expect(page.locator('.markdown a[href="/"]')).toBeVisible();
});

test('colour and scheme toggles are named buttons', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Toggle light or dark mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Colour theme' })).toBeVisible();
});
