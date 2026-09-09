---
title: 1. Why Bash & Safe Scripts.
---

## Why Bash

Bash is the universal glue of automation. It is on every Linux system, runs in every CI pipeline, and is the default shell in almost every Docker image. You cannot avoid it - so you should understand it.

**Bash is a good fit for:**

- Wrapping CLI tools (`git`, `docker`, `aws`, `kubectl`)
- CI pipeline steps
- Bootstrap and setup scripts
- File manipulation, renaming, moving
- Anything that is mostly gluing commands together

**Reach for Python or Go instead when you have:**

- Complex data structures
- HTTP requests or JSON parsing
- Scripts over ~200 lines
- Anything that needs proper error types
- Anything another team has to maintain

The rule: if you are fighting Bash to express an idea, it is telling you to use something else.

---

## The script that breaks CI at 2am

```bash
#!/bin/bash
# deploy.sh - the one that looked fine for 6 months

ENV=$1
aws s3 sync ./dist s3://my-bucket-$ENV
aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"
echo "Done"
```

What happens when `ENV` is empty? When `aws s3 sync` fails? When `$CF_ID` is unset?

This script silently succeeds even when the deploy failed. It exits 0. CI shows green. Production is broken.

Every one of these problems has the same fix - and it is mostly one line at the top.

---

## Start every script with these three things

```bash
#!/usr/bin/env bash
set -euo pipefail

# Your script here
```

- **`set -e`** - exit immediately on any command that returns non-zero. No more "the deploy failed but the script printed Done".
- **`set -u`** - treat unset variables as errors. `$UNDEFINED` becomes a fatal error, not an empty string.
- **`set -o pipefail`** - a pipeline fails if *any* command in it fails. Without this, `false | true` exits 0.

These three flags together turn Bash from "silently wrong" to "loudly correct". Almost every Bash incident comes from one of these being absent.

---

## `#!/usr/bin/env bash` not `#!/bin/bash`

```bash
#!/bin/bash
# Hardcoded path - works on Linux,
# breaks on macOS with Homebrew bash,
# breaks in Docker images where bash lives somewhere else
```

```bash
#!/usr/bin/env bash
# Finds the first 'bash' on $PATH
# Works everywhere - local, CI, Docker
# Picks up Homebrew bash on macOS
```

Use `#!/usr/bin/env bash` by default. Only use `#!/bin/bash` when you specifically need a known version at a known path.

---

## Always quote your variables

```bash
# Without quotes: word-splitting and glob expansion
FILE="my file.txt"
cp $FILE /tmp/       # → cp my file.txt /tmp/  (two args, breaks)
cp "$FILE" /tmp/     # → cp "my file.txt" /tmp/ (one arg, correct)

# Double-quote every variable expansion
echo "$HOME"
ls "$DIR"
rm -rf "$TMPDIR"
```

Unquoted variables with spaces silently split into multiple words. Files with spaces break scripts that look fine in testing.

**Exception:** `[[ ]]` and `$(( ))` do not require quoting inside them. Everything else: quote it.

---

## Arguments and defaults

```bash
#!/usr/bin/env bash
set -euo pipefail

# Positional arguments with defaults
ENV="${1:-}"                    # empty default - validate below
REGION="${2:-ap-southeast-2}"   # real default

# Validate required args
if [[ -z "$ENV" ]]; then
  echo "Usage: $0 <environment> [region]" >&2
  exit 1
fi

# One-liner guard - fail with a clear message if unset or empty
: "${AWS_PROFILE:?AWS_PROFILE must be set}"
: "${IMAGE_TAG:?IMAGE_TAG must be set}"
```

`${VAR:?message}` is one line per required variable and gives a clear error. Better than a wall of `if`-then-`fi` blocks.

---

## Variables and scope

```bash
# Convention: UPPER_CASE for env vars / globals, lower_case for locals
AWS_PROFILE="my-profile"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function deploy() {
  local env="$1"            # local scope - lowercase
  local region="${2:-ap-southeast-2}"
  local timestamp
  timestamp="$(date +%Y%m%d-%H%M%S)"

  echo "Deploying to $env/$region at $timestamp"
}
```

`local` prevents function variables leaking into global scope. Always use it inside functions - without it, every variable is global.

`readonly` makes a variable immutable. Use it for constants and computed paths that should never change after assignment.

---

## Conditionals with `[[ ]]`

```bash
# Use [[ ]] not [ ] - it's safer and more featureful
if [[ "$ENV" == "prod" ]]; then
  echo "deploying to production"
fi

# String tests
[[ -z "$VAR" ]]       # true if empty
[[ -n "$VAR" ]]       # true if non-empty
[[ "$A" == "$B" ]]    # string equality

# File tests
[[ -f "$FILE" ]]      # exists and is a regular file
[[ -d "$DIR" ]]       # exists and is a directory
[[ -x "$BINARY" ]]    # exists and is executable

# Combining conditions
if [[ -f "$CONFIG" && -r "$CONFIG" ]]; then
  source "$CONFIG"
fi
```

`[[ ]]` does not word-split or glob-expand, handles empty variables gracefully, and supports `==` pattern matching and `=~` regex.

---

## Functions: structure your script

```bash
#!/usr/bin/env bash
set -euo pipefail

# ── helpers ──────────────────────────────────────────────────────────────
log()  { echo "[$(date +%H:%M:%S)] $*"; }
die()  { echo "ERROR: $*" >&2; exit 1; }
info() { echo "  → $*"; }

# ── functions ─────────────────────────────────────────────────────────────
check_deps() {
  local deps=("aws" "jq" "curl")
  for dep in "${deps[@]}"; do
    command -v "$dep" &>/dev/null || die "required tool not found: $dep"
  done
}

deploy() {
  local env="$1"
  log "Starting deploy to $env"
  # ...
}

# ── main ──────────────────────────────────────────────────────────────────
main() {
  check_deps
  deploy "${1:?usage: $0 <env>}"
}

main "$@"
```

The `log`/`die`/`info` helpers are the first thing to add to any non-trivial script. The `main()` + `main "$@"` pattern makes the script importable - you can `source` it without executing it.

---

## Traps and cleanup

```bash
#!/usr/bin/env bash
set -euo pipefail

TMPDIR_WORK="$(mktemp -d)"

cleanup() {
  rm -rf "$TMPDIR_WORK"
  log "cleaned up $TMPDIR_WORK"
}
trap cleanup EXIT

on_error() {
  local exit_code=$?
  local line_number=${BASH_LINENO[0]}
  echo "ERROR: command failed with exit $exit_code at line $line_number" >&2
}
trap on_error ERR
```

`trap cleanup EXIT` is Bash's equivalent of `defer` - it always runs, even if the script exits early due to `set -e`. Temp files are always cleaned up.

---

## The production-ready template

```bash
#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()  { echo "[$(date +%H:%M:%S)] $*"; }
die()  { echo "ERROR: $*" >&2; exit 1; }

cleanup() { : ; }
trap cleanup EXIT

check_deps() {
  for dep in "$@"; do
    command -v "$dep" &>/dev/null || die "missing: $dep"
  done
}

main() {
  local env="${1:?usage: $(basename "$0") <env>}"
  check_deps aws jq
  : "${AWS_PROFILE:?AWS_PROFILE must be set}"
  log "deploying to $env"
  # ... actual work
}

main "$@"
```

This template gives you safe defaults, cleanup on exit, dependency checks, validated args, and clear errors. Everything that turned the 2am incident into a silent success is now a loud failure.
