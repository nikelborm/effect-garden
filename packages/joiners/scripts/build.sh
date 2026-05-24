#!/usr/bin/env bash
set -euo pipefail

command -v tsgo >/dev/null 2>&1 || {
  echo "tsgo is required but not installed."
  exit 1
}

rm -rf dist
tsgo
