#!/usr/bin/env bash
set -euo pipefail

command -v tsgo >/dev/null 2>&1 || {
  echo "tsgo is required but not installed."
  exit 1
}
command -v rollup >/dev/null 2>&1 || {
  echo "rollup is required but not installed."
  exit 1
}

command -v jq >/dev/null 2>&1 || {
  echo "jq is required but not installed."
  exit 1
}

rm -rf dist gh-page/bundled_deps
tsgo
mkdir -p ./dist/minified
rollup -c ./rollup.config.mts
# TODO: ?
# cli_name=$(jq -r '.name' package.json)
# chmod +x ./$cli_name.ts ./dist/$cli_name.js ./dist/minified/$cli_name.js
