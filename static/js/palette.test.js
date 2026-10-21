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

    expect(onScheme).toHaveBeenCalledWith('light', document.getElementById('theme-toggle'));

    onScheme.mockClear();
    document.getElementById('theme-toggle').click();
    expect(onScheme).toHaveBeenCalledWith('dark', document.getElementById('theme-toggle'));
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
