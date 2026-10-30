// Site-specific settings for the shared e2e master (playwright.config.ts + helpers/palette-helpers.ts).
import type { Page, PlaywrightTestConfig } from '@playwright/test';

export const site: {
  name: string;
  port: number;
  siteDir: string;
  snapshotTemplate?: string;
  projects: NonNullable<PlaywrightTestConfig['projects']>;
  sel: { trigger: string; popup: string; primary: string; secondary: string; reset: string; note: string; toggle: string };
  openPicker?: (page: Page) => Promise<void>;
} = {
  name: 'jcleal.me',
  port: 4171,
  siteDir: '../public',
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
