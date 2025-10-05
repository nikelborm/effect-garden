# syntax=docker/dockerfile:1-labs@sha256:9187104f31e3a002a8a6a3209ea1f937fb7486c093cbbde1e14b0fa0d7e4f1b5

# some parts are taken from https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM nginx:1.29-alpine3.22@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8 AS fixated_nginx
FROM oven/bun:1-alpine@sha256:ab596b6d0dcad05d23799b89451e92f4cdc16da184a9a4d240c42eaf3c4b9278 AS fixated_bun
FROM node:24.3.0-alpine3.21@sha256:54cb8b55c82b999ecfc6473c9a96181044911d5e7a37801dc2c485fc7cef2ed3 AS fixated_node


FROM fixated_nginx AS default_nginx

EXPOSE 80
RUN rm -rf /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf





FROM fixated_bun AS rehash_deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN --mount=type=cache,target=/etc/apk/cache apk add libc6-compat
WORKDIR /app
COPY package.json ./packages/scripts/rehash_deps.ts ./
COPY --parents packages/*/package.json ./
RUN mv packages packages_dirty && bun ./rehash_deps.ts





FROM fixated_bun AS deps
WORKDIR /app
COPY --from=rehash_deps /app/packages ./packages
COPY --from=rehash_deps /app/package.json ./
COPY patches/ patches/
COPY bun.lock ./

# TODO: integrate ccache?

# TODO: make sure packages's code doesn't end-up inside node_modules, since it's
# symlinked and packages can point at each other
RUN --mount=type=cache,target=/etc/apk/cache \
  --mount=type=cache,target=/root/.bun/install/cache \
  <<EOT sh
  set -uex
  # copyfile is the same speed as hardlink, because docker. symlinking wouldn't
  # work because cache will unmount later
  time env MAKEFLAGS="--jobs=$(nproc)" CMAKE_BUILD_PARALLEL_LEVEL="$(nproc)" bun install --backend=hardlink --frozen-lockfile --prefer-offline --no-progress --cache-dir=/root/.bun/install/cache
EOT
# TODO: maybe add cleanup of ctime, mtime, atime and other fluff, to improve
# layer hashing?





FROM fixated_bun AS monorepo_build_prod
WORKDIR /app
COPY packages/ packages/
COPY package.json bun.lock turbo.json ./
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir node_modules
# TODO: make sure packages's code doesn't end-up inside node_modules, since it's
# symlinked and packages can point at each other. And make sure these symlinks
# are restored after? I probably need to repeat installation here, so that bun
# properly symlinks it?
RUN --mount=type=bind,from=deps,source=/app/node_modules,target=/app/node_modules \
  # TODO: mount frontend's .next folder and everybody else's dist and dist-types
  # folder, or turbo can handle that?
  --mount=type=cache,sharing=private,target=/app/.turbo \
  <<EOT sh
  set -uex
  # temp dir is needed so frontend/src/lib/auth.ts can initialize in static generation mode
  mkdir temp
  bun run build
EOT





FROM fixated_node AS runtime_next_prod
WORKDIR /app
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser -D --system --uid 1001 nextjs
USER nextjs:nodejs
COPY --link --chown=nextjs:nodejs --from=monorepo_build_prod /app/packages/frontend/public ./public
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --link --chown=nextjs:nodejs --from=monorepo_build_prod /app/packages/frontend/.next/standalone ./
COPY --link --chown=nextjs:nodejs --from=monorepo_build_prod /app/packages/frontend/.next/static ./.next/static

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"

# until bun hasn't implemented async_hooks, it's not safe to use it for prod with next.js
# [bun] Warning: async_hooks.createHook is not implemented in Bun. Hooks can still be created but will never be called.
# [bun] Warning: async_hooks.executionAsyncId/triggerAsyncId are not implemented in Bun. It will return 0 every time.
CMD ["node", "server.js"]





FROM default_nginx AS prod_nginx_with_front_static

EXPOSE 443
# if prod.template.conf changed and app/build didn't then we chaply copy .conf
# if build changed we do rebuild and cheaply update conf
# COPY --from=build /app/build /usr/share/nginx/html/
# TODO: https://github.com/kristiyan-velkov/nextjs-prod-dockerfile/blob/main/Dockerfile.export#L46
# COPY --from=builder /app/out /usr/share/nginx/html
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static
# COPY --from=builder /app/public ./public
COPY ./nginx/prod.template.conf /etc/nginx/templates/nginx.conf.template
# If we swap 2 copy instructions it will be bad because on every .conf change we will do full rebuild.
# Full rebuild experienced AS much more expensive than unnoticeable copying a single little file every time build changes





FROM default_nginx AS dev_nginx
COPY ./nginx/dev.template.conf /etc/nginx/templates/nginx.conf.template





FROM fixated_bun AS monorepo_dev
WORKDIR /app
# Port of next.js dev server (3000) hardcoded in frontend/package.json
# port of backend server (3001) is default from
# https://github.com/nikelborm/effect-garden/blob/main/packages/backend-config/index.ts#L53
EXPOSE 3000 3001
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/etc/apk/cache apk add bash nodejs
ARG UID=1000
ARG GID=1000
RUN chown $UID:$GID /app
USER $UID:$GID
# Dirs created for mount points
RUN mkdir -p packages .turbo/cache
# TODO: make sure packages's code doesn't end-up inside node_modules, since it's
# symlinked and packages can point at each other. And make sure these symlinks
# are restored after? I probably need to repeat installation here, so that bun
# properly symlinks it? I think that's the reason `turbo run build` inside
# /entrypoint.sh gets cache misses constantly even though I mount it. Maybe use
# bun install --only-missing flag?
COPY --link --chown=$UID:$GID --from=deps /app/node_modules ./node_modules
COPY --chown=$UID:$GID package.json bun.lock turbo.json ./

# TODO: declare volume mount for ./.turbo/cache

ENV PATH="$PATH:/app/node_modules/.bin:/app/packages/scripts"

COPY --chmod=755 <<EOT /entrypoint.sh
#!/usr/bin/env sh
set -eux

# node ./node_modules/@better-auth/cli/dist/index.mjs migrate -y

turbo run build --filter=\!@nikelborm/frontend --filter=\!@nikelborm/backend --only --continue=always --color



exec bun dev --color
EOT

ENTRYPOINT [ "/entrypoint.sh" ]





FROM monorepo_dev AS monorepo_task_runner

COPY --chmod=755 <<EOT /entrypoint.sh
#!/usr/bin/env sh
set -eux

cleanup() {
  exit 0
}

trap cleanup TERM INT

sleep infinity &
# \$ is escaped in Dockerfile, to disable Dockerfile's variable expansion
wait \$!
EOT

ENTRYPOINT [ "/entrypoint.sh" ]
