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

## Testing

Unit tests (`static/js/palette.js`): `npm test`.

Playwright screenshot + interaction tests (system Chrome, external requests blocked) live in [./e2e](./e2e):
```bash
hugo --baseURL http://localhost:4171/ --destination public   # build the site (or `make compile-website`, then SITE_DIR=../dist/public)
cd e2e && npm ci && npx playwright test                      # run (SITE_DIR defaults to ../public)
npm run test:update                                          # refresh the committed baselines in e2e/*-snapshots
```
Or just `make e2e`.


## Running locally?

1. Using a <kbd>terminal</kbd>, run:
```bash
make serve
```

2. Using your browser, navigate to `localhost:1313`.
