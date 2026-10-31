import { test, expect } from './fixtures';

// Every link to github.com carries the official mark (inline, currentColor, 16px, aria-hidden) and a name.
const PAGES = ['/', '/contact/', '/resume/', '/workshops/', '/posts/', '/posts/my-caricatures/', '/docker-101/part-4/'];

for (const path of PAGES) {
  test(`github links on ${path}`, async ({ page }) => {
    await page.goto(path);
    for (const a of await page.locator('a[href*="github.com"]').all()) {
      await expect(a).toBeVisible();
      const svg = a.locator('svg[data-icon="github"]');
      await expect(svg).toHaveCount(1);
      await expect(svg).toBeVisible();
      await expect(svg).toHaveAttribute('aria-hidden', 'true');
      await expect(svg).toHaveAttribute('fill', 'currentColor');
      expect(await svg.evaluate((e) => [e.getBoundingClientRect().width, e.getBoundingClientRect().height])).toEqual([16, 16]);
      expect((await a.innerText()).trim().length).toBeGreaterThan(0);
    }
  });
}

test('footer has Source code + theme links with the mark; contact lists both GitHub profiles', async ({ page }) => {
  await page.goto('/contact/');
  expect(await page.locator('footer a[href*="github.com"], .footer a[href*="github.com"]').count()).toBe(2);
  expect(await page.locator('.markdown a[href*="github.com"], .post a[href*="github.com"]').count()).toBe(2);
});
