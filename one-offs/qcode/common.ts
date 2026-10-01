// biome-ignore-all lint/complexity/useLiteralKeys: https://github.com/biomejs/biome/issues/463

import * as Effect from 'effect/Effect'
import type { PlatformError } from 'effect/PlatformError'

export const HOME = process.env['HOME'] ?? '/root'
export const PROJECTS_DIR = `${HOME}/projects`

export const isNotFound = (error: PlatformError) =>
  error.reason._tag === 'NotFound'

export const logErrorOnNotFound =
  (message: string) =>
  (error: PlatformError): Effect.Effect<void> =>
    isNotFound(error) ? Effect.logError(message) : Effect.void

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
