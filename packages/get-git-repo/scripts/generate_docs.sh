#!/usr/bin/env bash
set -euo pipefail

# If you use vscode's live server plugin, it's better to leave this disabled,
# because recreation of the dir brakes hot-reload
# rm -rf tmp

mkdir -p tmp

custom_files="index.ts errors.ts cli.ts"

if [ ! -z "$custom_files" ]; then
  cp -f $custom_files tmp/.
fi

cp -rf src package.json package-lock.json deno.json tmp/.

cd tmp

# This option will add proper categories to all_symbols page but will break
# outcoming linking from index's pages
# grep -vEi 'errors.ts|cli.ts' index.ts >tmp.ts && mv tmp.ts index.ts

ln -sf ../node_modules node_modules

cli_name=$(jq -r '.name' package.json)

# This option will add proper categories to all_symbols page but will break
# outcoming linking from index's pages
# deno doc --html --name=$cli_name --output=docs index.ts cli.ts errors.ts

deno doc --html --name=$cli_name --output=docs index.ts

cd docs

find ./index -type f -exec sed -i 's_\.\./_../../_g' {} +
find ./index -type f -exec sed -i 's_\.\.&#x2F;_../../_g' {} +

# npx http-server -c-1 -o=index.html
