# effect-zstd

Zstd de/compression service for effect

Example:

```ts
import { FetchHttpClient, HttpClient } from "@effect/platform";
import * as NodeRuntime from "@effect/platform-node-shared/NodeRuntime";
import { Console, Effect, pipe, Stream } from "effect";
import { ZStd } from "effect-zstd";

Effect.gen(function* () {
	const zstd = yield* ZStd.ZStd;

	const result = yield* pipe(
		HttpClient.get("https://mit-license.org/license.txt"),
		Effect.map((response) => response.stream),
		Stream.unwrap,
		Stream.tap((e) => Console.log("raw bytes: ", e.byteLength)),
		zstd.compressStream(),
		Stream.tap((e) => Console.log("compressed bytes: ", e.byteLength)),
		zstd.decompressStream(),
		Stream.decodeText(),
		Stream.mkString,
	);

	yield* Console.log(result);
}).pipe(
	Effect.provide(FetchHttpClient.layer),
	Effect.provide(ZStd.ZStd.Default),
	Effect.scoped,
	NodeRuntime.runMain,
);
```
