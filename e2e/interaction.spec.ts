import { test, expect } from './fixtures';
import { contrastFailures } from './helpers/palette-helpers';
import type { Page } from '@playwright/test';

const PRIMARY = '#jc-custom-primary';
const SECONDARY = '#jc-custom-secondary';
const VARS = ['--pal-primary', '--pal-secondary', '--pal-link', '--pal-bg'];
const PAIRS: [string, string][] = [
  ['#c04828', '#2f7fae'],
  ['#008080', '#ff69b4'],
  ['#fffde0', '#ffffff'],
  ['#ffffff', '#ffffff'],
  ['#000000', '#000000'],
  ['#808080', '#808080'],
  ['#ff0000', '#0000ff'],
];

const openPopup = async (page: Page) => {
  await page.locator('#jc-palette-trigger').click();
  await expect(page.locator('#jc-palette-popup')).toHaveClass(/open/);
};

const setColour = (page: Page, sel: string, value: string) =>
  page.locator(sel).evaluate((el: HTMLInputElement, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);

const setCustom = async (page: Page, primary: string, secondary: string) => {
  await setColour(page, PRIMARY, primary);
  await setColour(page, SECONDARY, secondary);
};

const prop = (page: Page, sel: string, p: string) => page.locator(sel).first().evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), p);
const inline = (page: Page) => page.evaluate((vars) => vars.map((v) => document.documentElement.style.getPropertyValue(v)), VARS);
const stored = (page: Page) => page.evaluate(() => localStorage.getItem('palette-custom'));
const dotFill = (page: Page) => page.locator('#jc-palette-trigger svg path').first().evaluate((p) => getComputedStyle(p).fill);

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => { throw e; });
  await page.goto('/');
});

test('no preset swatches remain', async ({ page }) => {
  await openPopup(page);
  await expect(page.locator('.jc-palette-btn')).toHaveCount(0);
  await expect(page.locator(PRIMARY)).toHaveValue('#c04828');
  await expect(page.locator(SECONDARY)).toHaveValue('#2f7fae');
  await expect(page.locator('#jc-custom-reset')).toBeVisible();
});

test('popup opens, closes on outside click and Escape, not on colour input use', async ({ page }) => {
  await openPopup(page);
  await setColour(page, PRIMARY, '#336699');
  await page.locator('.jc-palette-custom label').first().click();
  await expect(page.locator('#jc-palette-popup')).toHaveClass(/open/);
  await page.locator('h3').first().click();
  await expect(page.locator('#jc-palette-popup')).not.toHaveClass(/open/);
  await openPopup(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#jc-palette-popup')).not.toHaveClass(/open/);
  await expect(page.locator('#jc-palette-trigger')).toHaveAttribute('aria-expanded', 'false');
});

for (const scheme of ['light', 'dark']) {
  test(`colours drive the whole look: bg, text, headings, links, code, footer (${scheme})`, async ({ page }) => {
    if (scheme === 'dark') await page.locator('#scheme-toggle').click();
    await expect(page.locator('html')).toHaveClass(scheme === 'dark' ? /dark/ : /^(?!.*dark)/);
    const read = async () => ({
      bg: await prop(page, 'body', 'background-color'),
      text: await prop(page, 'body', 'color'),
      h: await prop(page, 'h3', 'color'),
      link: await prop(page, '.post p a', 'color'),
      border: await prop(page, '.footer', 'border-top-color'),
      dot: await dotFill(page),
    });
    const before = await read();
    await openPopup(page);
    await setCustom(page, '#118833', '#aa22cc');
    const after = await read();
    for (const k of ['bg', 'text', 'h', 'link', 'dot'] as const) expect(after[k], k).not.toBe(before[k]);
    expect(JSON.parse((await stored(page))!)).toEqual({ primary: '#118833', secondary: '#aa22cc' });
  });
}

test('persists across reload, applied before DOMContentLoaded, inputs reflect it', async ({ page }) => {
  await openPopup(page);
  await setCustom(page, '#118833', '#aa22cc');
  await page.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') (window as any).__early = document.documentElement.style.getPropertyValue('--pal-primary');
    });
  });
  await page.reload();
  expect(await page.evaluate(() => (window as any).__early)).toBe('#118833');
  await expect(page.locator(PRIMARY)).toHaveValue('#118833');
  await expect(page.locator(SECONDARY)).toHaveValue('#aa22cc');
});

test('old `palette` preset key migrates once to palette-custom and is deleted', async ({ page }) => {
  await page.evaluate(() => { localStorage.setItem('palette', 'teal'); localStorage.removeItem('palette-custom'); });
  await page.reload();
  expect(JSON.parse((await stored(page))!)).toEqual({ primary: '#007c6e', secondary: '#cf386b' });
  expect(await page.evaluate(() => localStorage.getItem('palette'))).toBeNull();
  await openPopup(page);
  await expect(page.locator(PRIMARY)).toHaveValue('#007c6e');
});

test('Reset restores defaults and clears storage', async ({ page }) => {
  await openPopup(page);
  await setCustom(page, '#118833', '#aa22cc');
  await page.locator('#jc-custom-reset').click();
  await expect(page.locator('#jc-palette-popup')).toHaveClass(/open/);
  expect(await stored(page)).toBeNull();
  await expect(page.locator(PRIMARY)).toHaveValue('#c04828');
  await expect(page.locator(SECONDARY)).toHaveValue('#2f7fae');
  expect((await inline(page))[0]).toBe('#c04828');
});

for (const scheme of ['light', 'dark']) {
  for (const [p, s] of PAIRS) {
    test(`every visible text node keeps WCAG AA with ${p}/${s} (${scheme})`, async ({ page }) => {
      if (scheme === 'dark') await page.locator('#scheme-toggle').click();
      await openPopup(page);
      await setCustom(page, p, s);
      const bad = await contrastFailures(page, 4.5);
      expect(bad, JSON.stringify(bad.slice(0, 5))).toEqual([]);
      expect(await page.evaluate(() => (window as any).__auditCount)).toBeGreaterThan(15);
    });
  }
}

test('"adjusted" note appears for out-of-range picks and disappears for in-range ones', async ({ page }) => {
  await openPopup(page);
  await setCustom(page, '#fffde0', '#fffde0');
  await expect(page.locator('#jc-custom-note')).not.toBeEmpty();
  await setCustom(page, '#8a3a20', '#2a6590');
  await expect(page.locator('#jc-custom-note')).toBeEmpty();
});

for (const bad of ['{"primary":"red;}"}', '{"primary":"#12345","secondary":"#aa22cc"}', '{"primary":"#gggggg","secondary":"#aa22cc"}', 'not json', '{"primary":"#aa22cc"}']) {
  test(`corrupt stored value is ignored: ${bad}`, async ({ page }) => {
    await page.evaluate((v) => localStorage.setItem('palette-custom', v), bad);
    await page.reload();
    expect((await inline(page))[0]).toBe('#c04828');
    await expect(page.locator(PRIMARY)).toHaveValue('#c04828');
  });
}

test('popup stays within the viewport', async ({ page }) => {
  await openPopup(page);
  const box = (await page.locator('#jc-palette-popup').boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test('overscroll fix and footer layout', async ({ page }) => {
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY)).toBe('none');
  const f = await page.locator('.footer-inner').boundingBox();
  expect(f!.x + f!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('dark'));

test.describe('day/night scheme', () => {
  for (const os of ['light', 'dark'] as const) {
    test(`defaults to the OS scheme (${os}) with no stored choice`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: os });
      await page.evaluate(() => localStorage.removeItem('scheme'));
      await page.reload();
      expect(await isDark(page)).toBe(os === 'dark');
      expect(await page.evaluate(() => localStorage.getItem('scheme'))).toBeNull();
    });
  }

  test('OS dark applies before first paint (head script, no flash)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') (window as any).__early = document.documentElement.classList.contains('dark');
      });
    });
    await page.reload();
    expect(await page.evaluate(() => (window as any).__early)).toBe(true);
  });

  test('day/night toggle shows a visible icon in both schemes', async ({ page }) => {
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme as 'light' | 'dark' });
      await page.evaluate(() => localStorage.removeItem('scheme'));
      await page.reload();
      const svg = page.locator('#scheme-toggle svg');
      await expect(svg).toBeVisible();
      expect(await svg.locator('path, circle').count()).toBeGreaterThan(0);
    }
  });

  test('toggle persists under `scheme` across reload and beats the OS', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await page.locator('#scheme-toggle').click();
    expect(await isDark(page)).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('scheme'))).toBe('dark');
    await page.reload();
    expect(await isDark(page)).toBe(true);
  });

  test('OS change live-updates only while there is no explicit choice', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => localStorage.removeItem('scheme'));
    await page.reload();
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => isDark(page)).toBe(true);
    await page.locator('#scheme-toggle').click();
    await expect.poll(() => isDark(page)).toBe(false);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(200);
    expect(await isDark(page)).toBe(false);
  });
});
