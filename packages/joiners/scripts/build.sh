#!/usr/bin/env bash
set -euo pipefail

command -v rimraf >/dev/null 2>&1 || {
  echo "rimraf is required but not installed."
  exit 1
}
command -v tspc >/dev/null 2>&1 || {
  echo "tspc is required but not installed."
  exit 1
}

rimraf dist
tspc
