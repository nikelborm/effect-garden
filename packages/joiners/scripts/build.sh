#!/usr/bin/env bash
set -euo pipefail

command -v tsc >/dev/null 2>&1 || {
  echo "tsc is required but not installed."
  exit 1
}

rm -rf dist
tsc
