import { test, expect } from './fixtures';
import { mkdirSync } from 'node:fs';

// Full-page PNGs for eyeballing (gitignored); the assertions prove the page is genuinely styled, not just captured.
const OUT = 'screenshots/jcleal.me';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1300, height: 800 },
  phone: { width: 390, height: 844 },
};
const PAGES = { home: '/', workshops: '/workshops/' };

test('stylesheets and scripts use root-relative URLs (CSP is self-only; baseURL host may differ from the serving host)', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/');
  const urls = await page.locator('link[rel=stylesheet], script[src]').evaluateAll((els) =>
    els.map((e) => e.getAttribute('href') ?? e.getAttribute('src')),
  );
  expect(urls.length).toBeGreaterThan(3);
  expect(urls.filter((u) => !u!.startsWith('/'))).toEqual([]);
});

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  for (const [pageName, path] of Object.entries(PAGES)) {
    test(`renders styled: ${pageName} @ ${vpName}`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'viewports are set explicitly below; run once');
      await page.setViewportSize(viewport);

      const problems: string[] = [];
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
      page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
      page.on('response', (r) => {
        if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`);
      });

      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const [r, g, b] = bg.match(/\d+/g)!.map(Number);
      expect(r + g + b, `body background ${bg} should be dark`).toBeLessThan(200);

      const header = page.locator('.header').first();
      await expect(header).toBeVisible();
      await expect(header.locator('nav').first()).toBeVisible();
      await expect(page.locator('.header a[href="/resume"]').first()).toBeVisible();

      const avatar = header.locator('.avatar img').first();
      await expect(avatar).toBeVisible();
      const box = (await avatar.boundingBox())!;
      expect(box.width, 'caricature thumbnail width').toBeLessThanOrEqual(130);
      expect(box.height, 'caricature thumbnail height').toBeLessThanOrEqual(130);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(1);

      await page.screenshot({ path: `${OUT}/${pageName}-${vpName}.png`, fullPage: true });
      expect(problems).toEqual([]);
    });
  }
}
