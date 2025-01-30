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


## Running locally?

1. Using a <kbd>terminal</kbd>, run:
```bash
make serve
```

2. Using your browser, navigate to `localhost:1313`.
