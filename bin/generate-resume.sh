#!/usr/bin/env bash
# converts the raw resume markdown to a single pdf file.

# funcs.
die() { echo "$1" >&2; exit "${2:-1}"; }

# check pwd.
[[ ! -d .git ]] \
  && die "must be run from repository root directory"

# check deps.
deps=(docker)
for dep in "${deps[@]}"; do
  hash "$dep" 2>/dev/null || missing+=("$dep")
done
if [[ ${#missing[@]} -ne 0 ]]; then
  s=""; [[ ${#missing[@]} -gt 1 ]] && { s="s"; }
  die "missing dep${s}: ${missing[*]}"
fi

# vars.
repo=$(basename "$PWD") \
  || die "failed to retrieve repository name"

# build docker image.
docker build . -t "$repo" \
  || die "failed to build Dockerfile for $repo"

# setup out directory.
dir="public"
if [[ -d "$dir" ]]; then
  mkdir -p "$dir" \
    || die "failed to create $dir"
fi

# generate resume.
# https://pandoc.org/demos.html
file="$dir/Resume.pdf"
docker run --rm \
  -w /app \
  -v "$PWD:/app" \
  "$repo" --metadata-file ./resume/metadata.yml ./resume/data.md -o "$file" \
  || die "failed to create $file using pandoc"

# chown file.
# FIXME is this really needed?
sudo chown "$(whoami)" "$file" \
  || die "failed to chown $file"
