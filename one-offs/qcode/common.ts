// biome-ignore-all lint/complexity/useLiteralKeys: https://github.com/biomejs/biome/issues/463

import { and, equalsKey, isObject, refineDefinedKey } from 'is-kit'

import * as Effect from 'effect/Effect'

export const HOME = process.env['HOME'] ?? '/root'
export const PROJECTS_DIR = `${HOME}/projects`

export const isNotFoundError = and(
  isObject,
  refineDefinedKey('reason', equalsKey('_tag', 'NotFound')),
)

export const notFoundMessageCommon =
  'This error might also be caused by missing PATH. Try `qcode cache-path` in a shell where it resolves successfully to remember full PATH'

export const logAnyErrorWithNotFoundImproved =
  (notFoundMessage: string) =>
  (error: Error): Effect.Effect<void> =>
    Effect.logError(
      isNotFoundError(error)
        ? notFoundMessage + '\n' + notFoundMessageCommon
        : error.message,
    )

// Everything the controller ships / the remote caches lives here. The hash of
// the controller's own bundled source is the cache key, so a changed script
// (i.e. an incompatible version) transfers itself again instead of running a
// stale remote copy.
export const CACHE_DIR = `${HOME}/.cache/qcode`
export const SOCKET_DIR = `${CACHE_DIR}/sockets`

// Handshake markers the remote bootstrap prints on its stdout. The controller
// watches for exactly one of HIT/MISS to decide whether to feed the script in.
export const MARKER_HIT = 'QCODE::CACHE_HIT'
export const MARKER_MISS = 'QCODE::CACHE_MISS'
export const MARKER_READY = 'QCODE::PROVIDER_READY'
