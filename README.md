<!-- markdownlint-disable MD041 MD010 -->
[![./README.yml](https://github.com/jmpa-io/jcleal.me/actions/workflows/./README.yml/badge.svg)](https://github.com/jmpa-io/jcleal.me/actions/workflows/./README.yml)[![./cicd.yml](https://github.com/jmpa-io/jcleal.me/actions/workflows/./cicd.yml/badge.svg)](https://github.com/jmpa-io/jcleal.me/actions/workflows/./cicd.yml)

<p align="center">
  <img src="docs/logo.png"/>
</p>

# ``

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
Or just `make e2e` (builds into `dist/e2e` with the matching base URL, then runs the suite). The unit and e2e suites run in CI before anything deploys.

## Security

The CloudFront distribution (`cf/website/template.yml`) sends a response-headers policy: `Content-Security-Policy` (`script-src 'self'`, no third-party origins), HSTS, `frame-ancestors https://portfolio.jcleal.me` (only the portfolio desktop may frame this site, and there is no `X-Frame-Options` because it cannot name an origin), `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`. That only works because the site has **no third-party requests and no inline scripts**: fonts and feather icons are self-hosted and the small init scripts live in `static/js/` (`e2e/hygiene.spec.ts` guards this). Keep it that way, or update the policy in the template alongside the change. Missing pages return a real 404 (`layouts/404.html`).

### Shared masters (this repo is the master)

These files are mirrored byte-identical into art.jmpa.io, jmpa.io, portfolio.jcleal.me and startpage.jcleal.me: `static/js/palette.js`, `e2e/playwright.config.ts`, `e2e/helpers/palette-helpers.ts`, `e2e/server.mjs`. Edit them **here only**, then run `make e2e-sync` (`bash e2e/sync-master.sh`; `check` verifies without copying). Site-specific selectors/ports live in each repo's `e2e/site.ts`.


## Running locally?

1. Using a <kbd>terminal</kbd>, run:
```bash
make serve
```

2. Using your browser, navigate to `localhost:1313`.
