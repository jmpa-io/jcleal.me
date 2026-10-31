<!-- markdownlint-disable MD041 MD010 -->
<p align="center">
    <img src="docs/logo.png">
</p>

## `jcleal.me`

```diff
+ 🌐 My resume website.
```

<a href="LICENSE" target="_blank"><img src="https://img.shields.io/github/license/jmpa-io/jcleal.me.svg" alt="GitHub License"></a>
[![CI/CD](https://github.com/jmpa-io/jcleal.me/actions/workflows/cicd.yml/badge.svg)](https://github.com/jmpa-io/jcleal.me/actions/workflows/cicd.yml)

## Getting started

Using a <kbd>terminal</kbd>, run:
```bash
make
```
And you'll be a given a list of all the available commands in this repository.

#

For example, if you'd like to compile & generate the website with `hugo`, run:
```bash
make generate-website
```
See the [./Makefile](./Makefile) if you're interested in seeing the commands specific to this repository without cloning. You could also dive into the [./Makefile.common.mk](./Makefile.common.mk) but it's quite large.

## Colours and day/night

Two colours (Primary, Secondary) from the popup next to the header toggle drive every surface, text, border, link, button, selection and code colour (derived with CSS `oklch()` relative colours, lightness clamped so text stays WCAG AA in both modes; an "adjusted for readability" note appears when needed). Default is the sunset pair. There are no presets.

- Stored in `localStorage['palette-custom']` as `{primary, secondary}` (6-digit hex; anything else is ignored). The old `palette` preset key is migrated once, then deleted.
- Day/night follows `prefers-color-scheme` (live) until the sun/moon toggle is used; the explicit choice is stored in `localStorage['scheme']`.
- Both are applied by `static/js/palette.js` from `<head>` so there is no flash. `palette.js` is the master copy, mirrored byte-for-byte into art.jmpa.io, jmpa.io, portfolio.jcleal.me and startpage.jcleal.me.

## Tags

Posts and workshop overviews show their tags as chips at the **top**, under the title/date and above the content
(`layouts/partials/tag-chips.html`, used by `_default/single.html` and `partials/ws-layout.html`), each linking to `/tags/<tag>/`.
**Browse all tags** from the **Tags** item in the header nav (`[[menu.main]]` in `config.toml`, -> `/tags/`), or via
"Browse by tag" on the Workshops list.

## GitHub links

Every link to github.com shows the official GitHub mark (inline SVG, `currentColor`, 16px, `aria-hidden`, `data-icon="github"`):
`layouts/partials/github-mark.html`. Markdown links to github.com get it automatically from the render-link hook
(`layouts/_default/_markup/render-link.html`, which also opens them in a new tab); templates use the partial directly (footer).

## Testing

Unit tests (`static/js/palette.js`, includes a WCAG contrast sweep, migration, invalid storage, scheme): `npm test`.

Playwright screenshot + interaction tests (system Chrome, external requests blocked) live in [./e2e](./e2e):
```bash
hugo --baseURL http://localhost:4171/ --destination public   # build the site (or `make compile-website`, then SITE_DIR=../dist/public)
cd e2e && npm ci && npx playwright test                      # run (SITE_DIR defaults to ../public)
npm run test:update                                          # refresh the committed baselines in e2e/*-snapshots
```
Or just `make e2e`.

### Shared masters (this repo is the master)

These files are mirrored byte-identical into art.jmpa.io, jmpa.io, portfolio.jcleal.me and startpage.jcleal.me: `static/js/palette.js`, `e2e/playwright.config.ts`, `e2e/helpers/palette-helpers.ts`, `e2e/server.mjs`. Edit them **here only**, then run `make e2e-sync` (`bash e2e/sync-master.sh`; `check` verifies without copying). Site-specific selectors/ports live in each repo's `e2e/site.ts`.


## Running locally?

1. Using a <kbd>terminal</kbd>, run:
```bash
make serve
```

2. Using your browser, navigate to `localhost:1313`.
