import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// palette.js is a plain IIFE (no exports) that attaches window.Palette as a
// side effect of being loaded, and registers listeners directly on
// `document` (DOMContentLoaded, outside-click handling, etc). A single
// shared jsdom `document` would accumulate listeners across tests and cause
// cross-test interference (e.g. a stale DOMContentLoaded handler re-firing
// and double-toggling state), so each test gets a brand new JSDOM instance
// as the global window/document/localStorage, and vi.resetModules() forces
// palette.js's IIFE to re-run fresh against those new globals.
let dom;

beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
});

afterEach(() => {
  dom?.window?.close();
});

async function loadPalette() {
  vi.resetModules();
  await import('./palette.js');
  return window.Palette;
}

describe('Palette.init — initial palette application', () => {
  it('applies no palette class when storage is empty', async () => {
    const Palette = await loadPalette();
    Palette.init();
    expect(document.documentElement.classList.length).toBe(0);
  });

  it('applies the stored palette class on init', async () => {
    localStorage.setItem('palette', 'ocean');
    const Palette = await loadPalette();
    Palette.init();
    expect(document.documentElement.classList.contains('ocean')).toBe(true);
  });

  it('ignores an unrecognized stored palette value', async () => {
    localStorage.setItem('palette', 'not-a-real-palette');
    const Palette = await loadPalette();
    Palette.init();
    Palette.PALETTES.forEach((p) => {
      expect(document.documentElement.classList.contains(p)).toBe(false);
    });
  });

  it('supports a custom paletteKey option', async () => {
    localStorage.setItem('custom-palette', 'forest');
    const Palette = await loadPalette();
    Palette.init({ paletteKey: 'custom-palette' });
    expect(document.documentElement.classList.contains('forest')).toBe(true);
  });
});

describe('Palette.init — palette buttons', () => {
  it('marks the button matching the stored palette as active after DOMContentLoaded', async () => {
    document.body.innerHTML =
      '<button class="palette-btn" data-palette="ocean"></button>' +
      '<button class="palette-btn" data-palette="forest"></button>';
    localStorage.setItem('palette', 'ocean');
    const Palette = await loadPalette();
    Palette.init();
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const [oceanBtn, forestBtn] = document.querySelectorAll('.palette-btn');
    expect(oceanBtn.classList.contains('active')).toBe(true);
    expect(forestBtn.classList.contains('active')).toBe(false);
  });

  it('clicking the active palette button clears the palette', async () => {
    document.body.innerHTML = '<button class="palette-btn" data-palette="ocean"></button>';
    localStorage.setItem('palette', 'ocean');
    const Palette = await loadPalette();
    Palette.init();
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const btn = document.querySelector('.palette-btn');
    btn.click();

    expect(localStorage.getItem('palette')).toBeNull();
    expect(document.documentElement.classList.contains('ocean')).toBe(false);
    expect(btn.classList.contains('active')).toBe(false);
  });

  it('clicking a different palette button switches to it', async () => {
    document.body.innerHTML =
      '<button class="palette-btn" data-palette="ocean"></button>' +
      '<button class="palette-btn" data-palette="forest"></button>';
    localStorage.setItem('palette', 'ocean');
    const Palette = await loadPalette();
    Palette.init();
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const [oceanBtn, forestBtn] = document.querySelectorAll('.palette-btn');
    forestBtn.click();

    expect(localStorage.getItem('palette')).toBe('forest');
    expect(document.documentElement.classList.contains('forest')).toBe(true);
    expect(document.documentElement.classList.contains('ocean')).toBe(false);
    expect(forestBtn.classList.contains('active')).toBe(true);
    expect(oceanBtn.classList.contains('active')).toBe(false);
  });
});

describe('Palette.init — day/night scheme', () => {
  it('applies the dark class when the stored scheme is dark', async () => {
    localStorage.setItem('scheme', 'dark');
    const Palette = await loadPalette();
    Palette.init();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('does not apply the dark class when the stored scheme is light', async () => {
    localStorage.setItem('scheme', 'light');
    const Palette = await loadPalette();
    Palette.init();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles dark/light classes on the toggle element to match stored scheme', async () => {
    document.body.innerHTML = '<button id="theme-toggle"></button>';
    localStorage.setItem('scheme', 'light');
    const Palette = await loadPalette();
    Palette.init({ toggleId: 'theme-toggle' });
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const toggle = document.getElementById('theme-toggle');
    expect(toggle.classList.contains('light')).toBe(true);
    expect(toggle.classList.contains('dark')).toBe(false);
  });

  it('clicking the toggle flips the scheme and persists it to localStorage', async () => {
    document.body.innerHTML = '<button id="theme-toggle"></button>';
    localStorage.setItem('scheme', 'light');
    const Palette = await loadPalette();
    Palette.init({ toggleId: 'theme-toggle' });
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    document.getElementById('theme-toggle').click();

    expect(localStorage.getItem('scheme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.getElementById('theme-toggle').classList.contains('dark')).toBe(true);
  });

  it('invokes the onScheme callback with the current scheme', async () => {
    document.body.innerHTML = '<button id="theme-toggle"></button>';
    localStorage.setItem('scheme', 'light');
    const onScheme = vi.fn();
    const Palette = await loadPalette();
    Palette.init({ toggleId: 'theme-toggle', onScheme });
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const toggleEl = document.getElementById('theme-toggle');
    expect(onScheme.mock.calls.at(-1)[0]).toBe('light');
    expect(onScheme.mock.calls.at(-1)[1]).toBe(toggleEl);

    onScheme.mockClear();
    toggleEl.click();
    expect(onScheme.mock.calls.at(-1)[0]).toBe('dark');
  });
});

describe('Palette.init — trigger/popup', () => {
  it('clicking the trigger toggles the open class on the popup', async () => {
    document.body.innerHTML = '<button id="trigger"></button><div id="popup"></div>';
    const Palette = await loadPalette();
    Palette.init({ triggerId: 'trigger', popupId: 'popup' });
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const trigger = document.getElementById('trigger');
    const popup = document.getElementById('popup');

    trigger.click();
    expect(popup.classList.contains('open')).toBe(true);
  });

  it('clicking outside the popup and trigger closes the popup', async () => {
    document.body.innerHTML =
      '<button id="trigger"></button><div id="popup"></div><div id="outside"></div>';
    const Palette = await loadPalette();
    Palette.init({ triggerId: 'trigger', popupId: 'popup' });
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const popup = document.getElementById('popup');
    document.getElementById('trigger').click();
    expect(popup.classList.contains('open')).toBe(true);

    document.getElementById('outside').click();
    expect(popup.classList.contains('open')).toBe(false);
  });

  it('clicking a palette button closes an open popup', async () => {
    document.body.innerHTML =
      '<button id="trigger"></button>' +
      '<div id="popup"><button class="palette-btn" data-palette="ocean"></button></div>';
    const Palette = await loadPalette();
    Palette.init({ triggerId: 'trigger', popupId: 'popup' });
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const popup = document.getElementById('popup');
    document.getElementById('trigger').click();
    expect(popup.classList.contains('open')).toBe(true);

    document.querySelector('.palette-btn').click();
    expect(popup.classList.contains('open')).toBe(false);
  });
});

describe('Palette.init — custom colours', () => {
  const customOpts = {
    btnSelector: '.palette-btn',
    customIds: { primary: 'p1', secondary: 'p2', reset: 'rst', note: 'nt' },
  };
  const customDom =
    '<button class="palette-btn" data-palette="ocean"></button>' +
    '<input id="p1" type="color" value="#c04828"><input id="p2" type="color" value="#2f7fae">' +
    '<button id="rst"></button><span id="nt"></span>';
  const vars = () => ['--pal-base', '--pal-base-2'].map((v) => document.documentElement.style.getPropertyValue(v));

  it('applies stored custom colours on init and reflects them in the inputs', async () => {
    document.body.innerHTML = customDom;
    localStorage.setItem('palette-custom', JSON.stringify({ primary: '#118833', secondary: '#aa22cc' }));
    const Palette = await loadPalette();
    Palette.init(customOpts);
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    expect(vars()[0]).toContain('#118833');
    expect(vars()[1]).toContain('#aa22cc');
    expect(document.getElementById('p1').value).toBe('#118833');
  });

  it('clicking a preset clears custom colours, storage and the inputs', async () => {
    document.body.innerHTML = customDom;
    localStorage.setItem('palette-custom', JSON.stringify({ primary: '#118833', secondary: '#aa22cc' }));
    const Palette = await loadPalette();
    Palette.init(customOpts);
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    document.querySelector('.palette-btn').click();

    expect(vars()).toEqual(['', '']);
    expect(localStorage.getItem('palette-custom')).toBeNull();
    expect(localStorage.getItem('palette')).toBe('ocean');
    expect(document.getElementById('p1').value).toBe('#c04828');
  });

  it('ignores invalid stored custom colours (no CSS injection)', async () => {
    document.body.innerHTML = customDom;
    localStorage.setItem('palette-custom', '{"primary":"red;}","secondary":"#aa22cc"}');
    const Palette = await loadPalette();
    Palette.init(customOpts);
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    expect(vars()).toEqual(['', '']);
    expect(document.getElementById('p1').value).toBe('#c04828');
  });

  it('input events store valid colours and Reset clears them', async () => {
    document.body.innerHTML = customDom;
    const Palette = await loadPalette();
    Palette.init(customOpts);
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    const p1 = document.getElementById('p1');
    p1.value = '#336699';
    p1.dispatchEvent(new window.Event('input', { bubbles: true }));
    expect(JSON.parse(localStorage.getItem('palette-custom')).primary).toBe('#336699');

    document.getElementById('rst').click();
    expect(localStorage.getItem('palette-custom')).toBeNull();
    expect(vars()).toEqual(['', '']);
  });
});
