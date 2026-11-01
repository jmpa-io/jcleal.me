// Site-specific settings for the shared e2e master (playwright.config.ts + helpers/palette-helpers.ts).
import type { Page, PlaywrightTestConfig } from '@playwright/test';

export const site: {
  name: string;
  port: number;
  siteDir: string;
  defaults?: [string, string]; // [primary, secondary] default pair when it differs from sunset.
  snapshotTemplate?: string;
  projects: NonNullable<PlaywrightTestConfig['projects']>;
  sel: { trigger: string; popup: string; primary: string; secondary: string; reset: string; note: string; toggle: string };
  openPicker?: (page: Page) => Promise<void>;
} = {
  name: 'jcleal.me',
  port: Number(process.env.E2E_PORT || 4171), // E2E_PORT runs a second checkout/worktree beside the first.
  siteDir: '../public',
  defaults: ['#2f6fd6', '#5aa0d8'], // blue on dark: the site's own default (palette-init.js defaultScheme: 'dark').
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } },
  ],
  sel: {
    trigger: '#jc-palette-trigger',
    popup: '#jc-palette-popup',
    primary: '#jc-custom-primary',
    secondary: '#jc-custom-secondary',
    reset: '#jc-custom-reset',
    note: '#jc-custom-note',
    toggle: '#scheme-toggle',
  },
};
