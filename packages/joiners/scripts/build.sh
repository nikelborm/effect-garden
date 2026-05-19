#!/usr/bin/env bash
set -euo pipefail

command -v tspc >/dev/null 2>&1 || {
  echo "tspc is required but not installed."
  exit 1
}

rm -rf dist
tspc
