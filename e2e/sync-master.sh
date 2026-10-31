#!/usr/bin/env bash
# Mirrors the master copies that live in jcleal.me into the sibling repos (byte-identical), then verifies with cmp.
#   e2e/sync-master.sh          copy + verify
#   e2e/sync-master.sh check    verify only (non-zero exit on drift)
# Masters: static/js/palette.js (palette.js location differs per repo, see PALETTE below),
#          e2e/playwright.config.ts, e2e/helpers/palette-helpers.ts, e2e/server.mjs.
# Per-repo (never mirrored): e2e/site.ts and the *.spec.ts files. The CRT files (public/crt.{js,css}) are owned by
# portfolio.jcleal.me only (jmpa.io no longer has a CRT), so they are not mirrored.
set -euo pipefail
unset CDPATH

here="$(cd "$(dirname "$0")/.." && pwd)"
root="$(cd "$here/.." && pwd)"
mode="${1:-sync}"
# Worktrees sit beside the original checkouts as <repo>-audit: mirror into siblings carrying the same suffix.
suffix=""
case "$(basename "$here")" in *-audit) suffix="-audit" ;; esac

# repo -> where its palette.js mirror lives (a function, not declare -A, so it runs on macOS bash 3.2)
REPOS="art.jmpa.io jmpa.io portfolio.jcleal.me startpage.jcleal.me"
palette_path() {
  case "$1" in
    art.jmpa.io|jmpa.io) echo static/js/palette.js ;;
    portfolio.jcleal.me) echo public/palette.js ;;
    startpage.jcleal.me) echo src/js/palette.js ;;
  esac
}
E2E=(e2e/playwright.config.ts e2e/helpers/palette-helpers.ts e2e/server.mjs)

rc=0
for repo in $REPOS; do
  pairs=("static/js/palette.js:$(palette_path "$repo")")
  # startpage runs the master unit tests too (vitest + jsdom).
  [ "$repo" = startpage.jcleal.me ] && pairs+=("static/js/palette.test.js:src/js/palette.test.js")
  for f in "${E2E[@]}"; do pairs+=("$f:$f"); done
  for pair in "${pairs[@]}"; do
    src="$here/${pair%%:*}"
    dst="$root/$repo$suffix/${pair##*:}"
    if [ "$mode" = "sync" ]; then
      mkdir -p "$(dirname "$dst")"
      cp "$src" "$dst"
    fi
    if cmp -s "$src" "$dst"; then echo "ok     $repo/${pair##*:}"; else echo "DRIFT  $repo/${pair##*:}"; rc=1; fi
  done
done
exit $rc
