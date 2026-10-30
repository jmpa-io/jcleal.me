#!/usr/bin/env bash
# Mirrors the master copies that live in jcleal.me into the sibling repos (byte-identical), then verifies with cmp.
#   e2e/sync-master.sh          copy + verify
#   e2e/sync-master.sh check    verify only (non-zero exit on drift)
# Masters: static/js/palette.js (palette.js location differs per repo, see PALETTE below),
#          e2e/playwright.config.ts, e2e/helpers/palette-helpers.ts, e2e/server.mjs.
# Per-repo (never mirrored): e2e/site.ts and the *.spec.ts files.
set -euo pipefail
unset CDPATH

here="$(cd "$(dirname "$0")/.." && pwd)"
root="$(cd "$here/.." && pwd)"
mode="${1:-sync}"

# repo -> where its palette.js mirror lives
declare -A PALETTE=(
  [art.jmpa.io]=static/js/palette.js
  [jmpa.io]=static/js/palette.js
  [portfolio.jcleal.me]=public/palette.js
  [startpage.jcleal.me]=src/js/palette.js
)
E2E=(e2e/playwright.config.ts e2e/helpers/palette-helpers.ts e2e/server.mjs)

rc=0
for repo in "${!PALETTE[@]}"; do
  pairs=("static/js/palette.js:${PALETTE[$repo]}")
  for f in "${E2E[@]}"; do pairs+=("$f:$f"); done
  for pair in "${pairs[@]}"; do
    src="$here/${pair%%:*}"
    dst="$root/$repo/${pair##*:}"
    if [ "$mode" = "sync" ]; then
      mkdir -p "$(dirname "$dst")"
      cp "$src" "$dst"
    fi
    if cmp -s "$src" "$dst"; then echo "ok     $repo/${pair##*:}"; else echo "DRIFT  $repo/${pair##*:}"; rc=1; fi
  done
done
exit $rc
