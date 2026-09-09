---
title: 2. Arguments, Functions & Exercises.
---

## Exercises: build one real script, step by step

Each exercise adds to the same file. By the end you have a production-safe script you can commit. Use a real automation task - not a toy example. A deploy step, a repo setup script, a cleanup job.

---

## Exercise 1 - Safe skeleton (~5 min)

Create a new file. Pick a name that describes what it will do (`deploy.sh`, `setup.sh`, `cleanup.sh`).

```bash
#!/usr/bin/env bash
set -euo pipefail

log()  { echo "[$(date +%H:%M:%S)] $*"; }
die()  { echo "ERROR: $*" >&2; exit 1; }

main() {
  log "starting"
  echo "hello from $(basename "$0")"
  log "done"
}

main "$@"
```

```bash
chmod +x your-script.sh
./your-script.sh
```

**Test `set -u`:** add `echo "$UNDEFINED_VAR"` after `log "starting"`. Run it - it should fail with `unbound variable`, not print an empty line. Remove it after.

**Test `set -e`:** add `false` and confirm the script aborts before printing "done". Remove it after.

---

## Exercise 2 - Arguments & validation (~8 min)

Keep everything from Exercise 1. Add argument handling to `main()`:

```bash
main() {
  # Required argument - fails with usage message if missing
  local env="${1:?usage: $(basename "$0") <environment> [region]}"
  # Optional argument with default
  local region="${2:-ap-southeast-2}"

  # Validate the value, not just presence
  case "$env" in
    dev|staging|prod) ;;
    *) die "unknown environment: $env (expected: dev|staging|prod)" ;;
  esac

  # Guard: refuse to run in prod without explicit confirmation
  if [[ "$env" == "prod" ]]; then
    read -r -p "Deploying to PROD - are you sure? [y/N] " confirm
    [[ "$confirm" == "y" ]] || die "aborted"
  fi

  log "targeting $env in $region"
}
```

**Verify:**

```bash
./your-script.sh
# your-script.sh: 1: usage: your-script.sh <environment> [region]

./your-script.sh badenv
# ERROR: unknown environment: badenv (expected: dev|staging|prod)

./your-script.sh dev
# [10:31:00] targeting dev in ap-southeast-2

./your-script.sh prod
# Deploying to PROD - are you sure? [y/N] n
# ERROR: aborted
```

---

## Exercise 3 - Functions & structure (~8 min)

Keep everything from Exercise 2. Add a dependency check and extract real work into functions:

```bash
# Add above main()
check_deps() {
  local deps=("$@")
  for dep in "${deps[@]}"; do
    command -v "$dep" &>/dev/null \
      || die "required tool not found: $dep - please install it"
  done
}

do_the_thing() {
  local env="$1"
  local region="$2"
  log "doing the thing in $env/$region"
  # your real work here
}

main() {
  local env="${1:?usage: $(basename "$0") <environment> [region]}"
  local region="${2:-ap-southeast-2}"

  check_deps aws jq   # ← tools your script actually uses
  do_the_thing "$env" "$region"
}
```

Replace `aws jq` with whatever tools your script actually calls. No fake deps.

---

## Exercise 4 - Cleanup & error handling (~7 min)

Keep everything from Exercise 3. Add a trap for cleanup and error context:

```bash
# Add near the top, after set -euo pipefail
TMPDIR_WORK=""

cleanup() {
  if [[ -n "$TMPDIR_WORK" ]]; then
    rm -rf "$TMPDIR_WORK"
    log "cleaned up $TMPDIR_WORK"
  fi
}
trap cleanup EXIT

on_error() {
  local line="${BASH_LINENO[0]}"
  echo "ERROR: script failed at line $line" >&2
}
trap on_error ERR

# In main() or do_the_thing(), create and use a temp dir:
TMPDIR_WORK="$(mktemp -d)"
log "working in $TMPDIR_WORK"
```

`trap cleanup EXIT` fires on every exit - success, failure, or Ctrl-C. Temp files are always cleaned up.

**Verify:**

```bash
./your-script.sh dev
# [10:33:00] working in /tmp/tmp.abc123
# [10:33:00] doing the thing in dev/ap-southeast-2
# [10:33:00] cleaned up /tmp/tmp.abc123

# Add 'false' inside do_the_thing(), run again:
# [10:33:01] working in /tmp/tmp.xyz456
# ERROR: script failed at line 42
# [10:33:01] cleaned up /tmp/tmp.xyz456  ← trap still ran
```

---

## Exercise 5 - Wire in real work (~7 min)

Replace the placeholder `do_the_thing` with the actual commands your script needs to run.

**If you are writing a deploy script:**

```bash
deploy() {
  local env="$1"
  : "${AWS_PROFILE:?AWS_PROFILE must be set}"
  log "syncing to s3..."
  aws s3 sync ./dist "s3://my-bucket-$env/" --delete
  log "invalidating CDN..."
  aws cloudfront create-invalidation \
    --distribution-id "$CF_ID" \
    --paths "/*"
}
```

**If you are writing a setup script:**

```bash
setup() {
  local target_dir="$1"
  log "creating directory structure..."
  mkdir -p "$target_dir"/{src,tests,docs}
  log "copying config templates..."
  cp -r "$SCRIPT_DIR/templates/." "$target_dir/"
  log "initialising git..."
  git -C "$target_dir" init -q
}
```

Do not copy these verbatim - use your actual task. The point is to leave with something real.

**Final check:**

```bash
./your-script.sh              # → usage error
./your-script.sh badenv       # → validation error
./your-script.sh dev          # → runs, cleans up
./your-script.sh dev us-west-2  # → runs with override

head -3 your-script.sh
# #!/usr/bin/env bash
# set -euo pipefail

wc -l your-script.sh    # aim for under 150 lines
```

---

## What you built

- `set -euo pipefail` - fails loudly, never silently
- Validated args - clear usage errors, not mysterious crashes
- Dependency checks - tells you what is missing before it fails
- Functions - named, local-scoped, testable chunks
- Trap cleanup - temp files gone, always
- `main "$@"` - importable, not side-effectful on source

References: [shellcheck.net](https://www.shellcheck.net) · [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
