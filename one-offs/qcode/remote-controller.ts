// Remote mode — controller side (`qcode remote <host>`).

import * as Console from 'effect/Console'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { pipe } from 'effect/Function'
import * as Path from 'effect/Path'
import * as ChildProcess from 'effect/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'

import { MARKER_HIT, MARKER_MISS, SOCKET_DIR } from './common.ts'

const getSelfSource = Effect.gen(function* () {
  const selfPath = yield* Effect.sync(() => import.meta.path)

  // The single-file distribution is a bundled `.js`. If we are still a `.ts`
  // module then nothing was bundled and we have no self-contained source to
  // ship — that is an unrecoverable misconfiguration, so die.
  if (!selfPath.endsWith('.mjs'))
    return yield* Effect.die(
      `qcode remote mode needs the bundled single-file build, but it is running from '${selfPath}'. Build it first ('bun run build') and invoke the emitted .mjs.`,
    )

  const fs = yield* FileSystem.FileSystem
  const source = yield* fs.readFileString(selfPath)
  const hash = yield* Effect.sync(() => Bun.hash(source).toString(16))
  return { selfPath, source, hash }
}).pipe(Effect.cached, Effect.flatten)

// Make sure a background ssh control master (unix socket multiplexing) exists
// for `host` and return the socket path. If the socket is already present in
// the agreed folder we reuse it; otherwise we spin up a persistent master.
const ensureControlSocket = (host: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner

    yield* fs.makeDirectory(SOCKET_DIR, { recursive: true })

    const socket = path.join(
      SOCKET_DIR,
      host.replace(/[^A-Za-z0-9._-]/g, '_') + '.sock',
    )

    const masterAlive = yield* pipe(
      ChildProcess.make(
        'ssh',
        ['-o', `ControlPath=${socket}`, '-O', 'check', host],
        { stdout: 'ignore', stderr: 'ignore' },
      ),
      spawner.exitCode,
      Effect.map(code => (code as number) === 0),
      Effect.orElseSucceed(() => false),
    )

    if (!masterAlive) {
      yield* Effect.log(`establishing ssh control master for '${host}'`)
      const code = yield* pipe(
        ChildProcess.make(
          'ssh',
          [
            '-fN', // go to background, run no remote command
            '-M', // this connection is the master
            '-o',
            'ControlMaster=auto',
            '-o',
            `ControlPath=${socket}`,
            '-o',
            'ControlPersist=10m',
            host,
          ],
          { stdout: 'inherit', stderr: 'inherit' },
        ),
        spawner.exitCode,
      )

      if ((code as number) !== 0)
        return yield* Effect.fail(
          new Error(
            `failed to establish ssh control master for '${host}' (exit ${code})`,
          ),
        )
    }

    return socket
  })

// The tiny bash program executed on the remote through ssh. It reports cache
// presence on stdout, then either execs the cached copy immediately, or reads
// the incoming script from stdin (until EOF), atomically installs it, and
// execs it. `mktemp`/`mv` live in the cache dir so the rename is atomic.
export const makeRemoteBootstrap = (hash: string) =>
  `
set -eu
cache_dir="$HOME/.cache/qcode"
target="$cache_dir/${hash}.js"
mkdir -p "$cache_dir"
if [ -f "$target" ]; then
  echo '${MARKER_HIT}'
  exec bun "$target" provide
fi
echo '${MARKER_MISS}'
tmp="$(mktemp "$cache_dir/tmp.XXXXXXXXXX")"
cat > "$tmp"
mv "$tmp" "$target"
exec bun "$target" provide
`.trim()

export const runController = (host: string) =>
  Effect.gen(function* () {
    const self = yield* getSelfSource
    const socket = yield* ensureControlSocket(host)
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner

    // `-T` disables pseudo-terminal allocation so the script bytes travel over
    // stdin/stdout untouched (no echo, no CR/LF mangling).
    const proc = yield* ChildProcess.make(
      'ssh',
      [
        '-T',
        '-o',
        `ControlPath=${socket}`,
        host,
        makeRemoteBootstrap(self.hash),
      ],
      { stderr: 'inherit' },
    ).pipe(spawner.spawn)

    // Resolved to `true` when the remote asked for the script (cache miss),
    // `false` on a hit (or if the stream ends before any marker appears).
    const shouldSend = yield* Deferred.make<boolean>()
    const sawMarker = yield* Ref.make(false)

    const onLine = (line: string) =>
      Effect.gen(function* () {
        if (yield* Ref.get(sawMarker)) {
          // Past the handshake: everything now is the provider's own output.
          yield* Console.log(line)
          return
        }

        if (line === MARKER_HIT) {
          yield* Ref.set(sawMarker, true)
          yield* Deferred.succeed(shouldSend, false)
          yield* Effect.log(`remote cache hit for version ${self.hash}`)
        } else if (line === MARKER_MISS) {
          yield* Ref.set(sawMarker, true)
          yield* Deferred.succeed(shouldSend, true)
          yield* Effect.log(
            `remote cache miss; shipping ${self.source.length} bytes (version ${self.hash})`,
          )
        } else if (line.trim().length > 0) {
          yield* Effect.logWarning(`unexpected pre-handshake line: ${line}`)
        }
      })

    const pumpStdout = proc.stdout.pipe(
      Stream.decodeText,
      Stream.splitLines,
      Stream.runForEach(onLine),
      // If stdout closes before a marker was seen, unblock the stdin fiber.
      Effect.ensuring(Effect.ignore(Deferred.succeed(shouldSend, false))),
    )

    const feedStdin = Effect.gen(function* () {
      if (yield* Deferred.await(shouldSend))
        yield* Stream.run(
          Stream.encodeText(Stream.make(self.source)),
          proc.stdin,
        )
    })

    const [code] = yield* Effect.all([proc.exitCode, pumpStdout, feedStdin], {
      concurrency: 'unbounded',
    })

    if ((code as number) !== 0) {
      yield* Effect.logError('remote qcode exited with non-zero code: ', code)
      return code
    }

    return ChildProcessSpawner.ExitCode(0)
  }).pipe(Effect.scoped, Effect.withSpan('qcode.controller'))
