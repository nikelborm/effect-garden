#!/usr/bin/env bash
set -euo pipefail

# If you use vscode's live server plugin, it's better to leave this disabled,
# because recreation of the dir brakes hot-reload
# rm -rf tmp

mkdir -p tmp

cp -rf src package.json package-lock.json deno.json tmp/.

cd tmp

ln -sf ../node_modules node_modules

cli_name=$(jq -r '.name' package.json)

deno doc --html --name=$cli_name --output=docs src/index.ts

cd docs

find ./index -type f -exec sed -i 's_\.\./_../../_g' {} +
find ./index -type f -exec sed -i 's_\.\.&#x2F;_../../_g' {} +

# npx http-server -c-1 -o=index.html
