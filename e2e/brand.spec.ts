import { test, expect } from './fixtures';

// The CloudFront policy from cf/website/template.yml (img-src 'self' data:), enforced here so a blocked logo fails the test.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const ASSETS = ['/favicon.ico', '/favicon-32x32.png', '/favicon-64x64.png', '/apple-touch-icon.png', '/logo-64.png', '/og-image.png'];

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const r = await route.fetch();
    await route.fulfill({ response: r, headers: { ...r.headers(), 'content-security-policy': CSP } });
  });
});

test('hoodie favicon, apple-touch-icon, brand logo and share image resolve as images', async ({ page, request }) => {
  for (const a of ASSETS) {
    const r = await request.get(a);
    expect(r.status(), a).toBe(200);
    expect(r.headers()['content-type'], a).toMatch(/^image\//);
  }
  await page.goto('/');
  for (const sel of ['link[rel="icon"][href="/favicon.ico"]', 'link[rel="icon"][sizes="32x32"]', 'link[rel="apple-touch-icon"][href="/apple-touch-icon.png"]']) {
    await expect(page.locator(sel)).toHaveCount(1);
  }
});

test('the header title has no logo image and the page does not overflow at 390px', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) problems.push(m.text()); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.site-title img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(problems).toEqual([]);
});

test('share image meta is absolute, on the site origin, and points at an existing image', async ({ page, request }) => {
  await page.goto('/');
  for (const sel of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    const url = await page.locator(sel).first().getAttribute('content');
    expect(url, sel).toMatch(/^https?:\/\/[^/]+\/og-image\.png$/);
    const r = await request.get(new URL(url!).pathname);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toMatch(/^image\//);
  }
});
