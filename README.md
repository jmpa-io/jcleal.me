<!-- markdownlint-disable MD041 MD010 -->
[![jcleal.me](https://github.com/jmpa-io/jcleal.me/actions/workflows/cicd.yml/badge.svg)](https://github.com/jmpa-io/jcleal.me/actions/workflows/cicd.yml)
[![jcleal.me](https://github.com/jmpa-io/jcleal.me/actions/workflows/README.yml/badge.svg)](https://github.com/jmpa-io/jcleal.me/actions/workflows/README.yml)

# `jcleal.me`

```diff
+ My resume/ blog website.
```

## Scripts

script|description
---|---
[bin/compile.sh](bin/compile.sh) | Compile the static website using docker + hugo.
[bin/generate-resume.sh](bin/generate-resume.sh) | Converts the raw resume markdown to a single pdf file.
[bin/invalidate-cloudfront.sh](bin/invalidate-cloudfront.sh) | Invalidate files in the CloudFront cache, to make it quicker to update the deployed website.
[bin/local.sh](bin/local.sh) | Run this repository inside a docker container.
[bin/sync.sh](bin/sync.sh) | Upload content to website.

