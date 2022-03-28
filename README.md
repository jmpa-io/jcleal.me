<!-- markdownlint-disable MD041 MD010 -->
[![jcleal.me](https://github.com/jmpa-io/jcleal.me/actions/workflows/cicd.yml/badge.svg)](https://github.com/jmpa-io/jcleal.me/actions/workflows/cicd.yml)
[![jcleal.me](https://github.com/jmpa-io/jcleal.me/actions/workflows/README.yml/badge.svg)](https://github.com/jmpa-io/jcleal.me/actions/workflows/README.yml)

<p align="center">
  <img src="img/logo.png"/>
</p>

# `jcleal.me`

```diff
+ 🌐 My resume/ blog website.
```

## Scripts

script|description
---|---
[bin/compile.sh](bin/compile.sh) | Compile the static website using docker + hugo.
[bin/generate-resume.sh](bin/generate-resume.sh) | Converts the raw resume markdown to a single pdf file.
[bin/invalidate-cloudfront.sh](bin/invalidate-cloudfront.sh) | Invalidate files in the CloudFront cache, to make it quicker to update the deployed website.
[bin/local.sh](bin/local.sh) | Run this repository inside a docker container.
[bin/sync.sh](bin/sync.sh) | Upload content to website.


## TODOs

* [x] Deploy website (via ci/cd).
* [x] Add resume to site.
* [x] Add ci/cd step to generate pdf from resume.md using https://pandoc.org/.
* [ ] Add some blog content (eg. a blog post on how this website is managed / deployed).
* [ ] Look into creating a custom theme.
* [ ] Add some javascript charts which demo how to do sorting (eg. bubble sort).
