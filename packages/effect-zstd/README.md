# effect-zstd

Zstd de/compression service for effect

Example:

```ts
import { ZStd } from 'effect-zstd'

import * as NodeRuntime from '@effect/platform-node/NodeRuntime'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Stream from 'effect/Stream'
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient'
import * as HttpClient from 'effect/unstable/http/HttpClient'
import * as HttpClientResponse from 'effect/unstable/http/HttpClientResponse'

ZStd.Service.use(zstd =>
  pipe(
    HttpClient.get('https://mit-license.org/license.txt'),
    HttpClientResponse.stream,
    Stream.tap(e => Console.log('Raw bytes: ', e.byteLength)),
    zstd.compressStream(),
    Stream.tap(e => Console.log('Compressed bytes: ', e.byteLength)),
    zstd.decompressStream(),
    Stream.decodeText(),
    Stream.mkString,
  ),
).pipe(
  Effect.flatMap(Console.log),
  Effect.provide(FetchHttpClient.layer),
  Effect.provide(ZStd.layer),
  NodeRuntime.runMain,
)
```
