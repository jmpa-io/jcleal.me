import { test, expect } from './fixtures';
import { contrastFailures, pinScheme, settleStyles } from './helpers/palette-helpers';

const POST = '/posts/my-caricatures/';

test.beforeEach(async ({ page }) => {
  await settleStyles(page);
});

test.describe('tags on a post', () => {
  test('chips sit under the title/date and above the content, none below', async ({ page }) => {
    await page.goto(POST);
    const chips = page.locator('.tag-chips');
    await expect(chips).toHaveCount(1);
    const title = (await page.locator('.post h1.title').boundingBox())!;
    const c = (await chips.boundingBox())!;
    const md = (await page.locator('.post .markdown').boundingBox())!;
    expect(c.y).toBeGreaterThanOrEqual(title.y + title.height - 1);
    expect(c.y + c.height).toBeLessThanOrEqual(md.y + 1);
    // DOM order: chips come before the content block.
    expect(await page.evaluate(() => !!(document.querySelector('.tag-chips')!.compareDocumentPosition(document.querySelector('.post .markdown')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    // nothing tag-like after the content.
    expect(await page.locator('.markdown ~ .tags, .markdown ~ .tag-chips').count()).toBe(0);
    expect(await page.locator('.post .tags').count()).toBe(0);
  });

  test('each chip links to /tags/<tag>/ and that page renders', async ({ page }) => {
    await page.goto(POST);
    const links = page.locator('.tag-chips a');
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    for (const a of await links.all()) {
      const href = (await a.getAttribute('href'))!;
      expect(href).toMatch(/^\/tags\/[a-z0-9-]+\/$/);
    }
    await links.first().click();
    await expect(page).toHaveURL(/\/tags\/caricatures\/$/);
    await expect(page.locator('body')).toContainText('My caricatures');
  });

  test('chips wrap inside the page and meet AA in both schemes', async ({ page }) => {
    for (const scheme of ['light', 'dark'] as const) {
      await pinScheme(page, scheme);
      await page.goto(POST);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const vw = page.viewportSize()!.width;
      for (const a of await page.locator('.tag-chips a').all()) {
        const b = (await a.boundingBox())!;
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(vw);
      }
      const bad = (await contrastFailures(page, 4.5)).filter((f: any) => JSON.stringify(f).includes('tag'));
      expect(bad).toEqual([]);
    }
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`screenshot post ${scheme}`, async ({ page }) => {
      await pinScheme(page, scheme);
      await page.goto(POST);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`post-tags-${scheme}.png`);
    });
  }

  test('workshop overview shows its tags at the top, above the content', async ({ page }) => {
    await page.goto('/bash-101/');
    const c = (await page.locator('.ws-main .tag-chips').boundingBox())!;
    const first = (await page.locator('.ws-main > :not(.tag-chips)').first().boundingBox())!;
    expect(c.y).toBeLessThanOrEqual(first.y);
    expect(await page.locator('.ws-main .tag-chips a').count()).toBeGreaterThanOrEqual(3);
  });
});

test.describe('browsing tags', () => {
  test('header nav has a Tags link that opens /tags/', async ({ page, isMobile }) => {
    await page.goto('/');
    const nav = page.locator('header, .header').first();
    const link = nav.getByRole('link', { name: 'Tags', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/tags');
    await link.click();
    await expect(page).toHaveURL(/\/tags\/?$/);
    await expect(page.locator('h1.page-title')).toHaveText('Tags');
    expect(await page.locator('.tag-bar-row').count()).toBeGreaterThan(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('a /tags/<tag>/ page lists the tagged content', async ({ page }) => {
    await page.goto('/tags/bash/');
    await expect(page.locator('body')).toContainText(/bash/i);
    expect(await page.locator('a[href*="bash-101"]').count()).toBeGreaterThan(0);
  });
});
