import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const PRIMARY = '#jc-custom-primary';
const SECONDARY = '#jc-custom-secondary';
const VARS = ['--pal-base', '--pal-base-dark', '--pal-base-2', '--pal-base-2-dark'];

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

const inline = (page: Page) =>
  page.evaluate((vars) => vars.map((v) => document.documentElement.style.getPropertyValue(v)), VARS);

// Resolves any CSS colour (incl. oklch) to sRGB via a canvas, then returns WCAG luminance.
const lum = async (page: Page, css: string) =>
  page.evaluate((c) => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }, css);

// WCAG contrast of the body-text link colour against the effective page background.
const linkContrast = async (page: Page) => {
  const { fg, bg } = await page.evaluate(() => {
    const a = document.querySelector('.post p a')!;
    return {
      fg: getComputedStyle(a).color,
      bg: [document.body, document.documentElement]
        .map((e) => getComputedStyle(e).backgroundColor)
        .find((c) => c !== 'rgba(0, 0, 0, 0)') ?? '#fff',
    };
  });
  const [l1, l2] = [await lum(page, fg), await lum(page, bg)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const linkColour = (page: Page) => page.locator('.post p a').first().evaluate((a) => getComputedStyle(a).color);

const dotFill = (page: Page) =>
  page.locator('#jc-palette-trigger svg path').first().evaluate((p) => getComputedStyle(p).fill);

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => { throw e; });
  await page.goto('/');
});

test('palette popup opens from the trigger and closes on outside click, not on colour input use', async ({ page }) => {
  await openPopup(page);
  await page.locator(PRIMARY).click({ trial: true });
  await setColour(page, PRIMARY, '#336699');
  await page.locator('.jc-palette-custom label').first().click();
  await expect(page.locator('#jc-palette-popup')).toHaveClass(/open/);
  await page.locator('h3').first().click();
  await expect(page.locator('#jc-palette-popup')).not.toHaveClass(/open/);
});

for (const scheme of ['light', 'dark']) {
  test(`custom colours recolour links, headings and trigger dot (${scheme})`, async ({ page }) => {
    if (scheme === 'dark') await page.locator('#scheme-toggle').click();
    await expect(page.locator('html')).toHaveClass(scheme === 'dark' ? /dark/ : /^(?!.*dark)/);
    const before = await linkColour(page);
    const dotBefore = await dotFill(page);
    await openPopup(page);
    await setCustom(page, '#118833', '#aa22cc');
    expect(await linkColour(page)).not.toBe(before);
    expect(await inline(page)).toEqual(expect.arrayContaining([expect.stringContaining('#118833'), expect.stringContaining('#aa22cc')]));
    expect(await dotFill(page)).not.toBe(dotBefore);
    if (scheme === 'light') {
      const h3 = await page.locator('h3').first().evaluate((e) => getComputedStyle(e).color);
      await setCustom(page, '#cc2222', '#aa22cc');
      expect(await page.locator('h3').first().evaluate((e) => getComputedStyle(e).color)).not.toBe(h3);
    }
    expect(JSON.parse((await page.evaluate(() => localStorage.getItem('palette-custom')))!)).toEqual(
      scheme === 'light' ? { primary: '#cc2222', secondary: '#aa22cc' } : { primary: '#118833', secondary: '#aa22cc' });
  });
}

test('custom colours persist across reload, before DOMContentLoaded, and inputs reflect them', async ({ page }) => {
  await openPopup(page);
  await setCustom(page, '#118833', '#aa22cc');
  await page.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') {
        (window as any).__earlyVar = document.documentElement.style.getPropertyValue('--pal-base');
      }
    });
  });
  await page.reload();
  expect(await page.evaluate(() => (window as any).__earlyVar)).toContain('#118833');
  await expect(page.locator(PRIMARY)).toHaveValue('#118833');
  await expect(page.locator(SECONDARY)).toHaveValue('#aa22cc');
  await expect(page.locator('.jc-palette-btn.active')).toHaveCount(0);
});

test('preset click clears custom colours; same preset again toggles it off', async ({ page }) => {
  await openPopup(page);
  await setCustom(page, '#118833', '#aa22cc');
  await page.locator('.jc-palette-btn[data-palette="ocean"]').click();
  expect((await inline(page)).every((v) => v === '')).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('palette-custom'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('palette'))).toBe('ocean');
  await expect(page.locator('.jc-palette-btn[data-palette="ocean"]')).toHaveClass(/active/);
  await openPopup(page);
  await expect(page.locator(PRIMARY)).toHaveValue('#c04828');
  await expect(page.locator('#jc-custom-note')).toBeEmpty();
  await page.locator('.jc-palette-btn[data-palette="ocean"]').click();
  expect(await page.evaluate(() => localStorage.getItem('palette'))).toBeNull();
  await expect(page.locator('.jc-palette-btn.active')).toHaveCount(0);
});

test('Reset restores defaults and clears storage', async ({ page }) => {
  await openPopup(page);
  await setCustom(page, '#118833', '#aa22cc');
  await page.locator('#jc-custom-reset').click();
  await expect(page.locator('#jc-palette-popup')).toHaveClass(/open/);
  expect((await inline(page)).every((v) => v === '')).toBe(true);
  expect(await page.evaluate(() => [localStorage.getItem('palette-custom'), localStorage.getItem('palette')])).toEqual([null, null]);
  await expect(page.locator(PRIMARY)).toHaveValue('#c04828');
  await expect(page.locator(SECONDARY)).toHaveValue('#2f7fae');
});

// Prints measured ratios into the test report; the floor guards against unreadable picks.
for (const scheme of ['light', 'dark']) {
  for (const colour of ['#ffffff', '#fffde0', '#000000', '#808080']) {
    test(`extreme pick ${colour} stays readable (${scheme})`, async ({ page }, info) => {
      if (scheme === 'dark') await page.locator('#scheme-toggle').click();
      await openPopup(page);
      await setCustom(page, colour, colour);
      const ratio = await linkContrast(page);
      info.annotations.push({ type: 'contrast', description: `${colour} ${scheme}: ${ratio.toFixed(2)}:1` });
      expect(ratio).toBeGreaterThanOrEqual(3.5);
    });
  }
}

test('"adjusted" note appears for out-of-range picks and disappears for in-range ones', async ({ page }) => {
  await openPopup(page);
  await setCustom(page, '#fffde0', '#fffde0');
  await expect(page.locator('#jc-custom-note')).not.toBeEmpty();
  await setCustom(page, '#8a3a20', '#206080');
  await expect(page.locator('#jc-custom-note')).toBeEmpty();
});

for (const bad of ['{"primary":"red;}"}', '{"primary":"#12345","secondary":"#aa22cc"}', '{"primary":"#gggggg","secondary":"#aa22cc"}', 'not json', '{"primary":"#aa22cc"}']) {
  test(`corrupt stored value is ignored: ${bad}`, async ({ page }) => {
    await page.evaluate((v) => localStorage.setItem('palette-custom', v), bad);
    await page.reload();
    expect((await inline(page)).every((v) => v === '')).toBe(true);
    await expect(page.locator(PRIMARY)).toHaveValue('#c04828');
  });
}

test('popup stays within the viewport', async ({ page }) => {
  await openPopup(page);
  const box = (await page.locator('#jc-palette-popup').boundingBox())!;
  const vw = page.viewportSize()!.width;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vw);
});

test('overscroll fix and footer layout', async ({ page }) => {
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY)).toBe('none');
  const f = await page.locator('.footer-inner').boundingBox();
  expect(f!.x + f!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
