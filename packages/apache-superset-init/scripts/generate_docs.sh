#!/usr/bin/env bash
set -euo pipefail

# If you use vscode's live server plugin, it's better to leave this disabled,
# because recreation of the dir breaks hot-reload
# rm -rf tmp

mkdir -p tmp

custom_files=""

if [ ! -z "$custom_files" ]; then
  cp -f $custom_files tmp/.
fi

cp -rf src package.json package-lock.json deno.json tmp/.

cd tmp

ln -sf ../node_modules node_modules

cli_name=$(jq -r '.name' package.json)

deno doc --html --name=$cli_name --output=docs src/index.ts

# npx http-server -c-1 -o=index.html
