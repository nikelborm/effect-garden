import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as FileSystem from '@effect/platform/FileSystem'
import * as HttpClient from '@effect/platform/HttpClient'
import * as BunFileSystem from '@effect/platform-bun/BunFileSystem'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'

await Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const list = (yield* fs.readDirectory('./public/samples')).filter(e =>
    e.startsWith('pattern'),
  )
  const list2 = []
  for (const element of list) {
    list2.push(
      ...(yield* fs.readDirectory(`./public/samples/${element}`)).map(
        e => `./public/samples/${element}/${e}`,
      ),
    )
  }
  const ers = yield* Effect.forEach(list2, p =>
    Effect.all({
      path: Effect.succeed(p),
      stat: fs.stat(p),
    }),
  )
  const resumeFromByte = 50
  for (const element of ers) {
    const client = HttpClient.filterStatusOk(yield* HttpClient.HttpClient)
    const response = yield* client.get(
      `http://localhost:3000` + element.path.replace('./public', ''),
      resumeFromByte ? { headers: { Range: `bytes=${resumeFromByte}-` } } : {},
    )
    const actualSize = yield* response.stream.pipe(
      Stream.map(e => e.byteLength),
      Stream.runSum,
    )
    yield* Console.log(element.path, element.stat.size - BigInt(actualSize))
  }
}).pipe(
  Effect.provide(BunFileSystem.layer),
  Effect.provide(FetchHttpClient.layer),
  Effect.runPromise,
)
