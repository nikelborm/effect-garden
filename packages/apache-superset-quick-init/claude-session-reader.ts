import * as FileSystem from '@effect/platform/FileSystem'
import * as NodeContext from '@effect/platform-node/NodeContext'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Logger from 'effect/Logger'

import { decodeClaudeSessionLine } from './session-reader-schema.ts'

const sessionPath =
  '/home/nikel/.claude/projects/-home-nikel-projects-extension-json-schema-offline/87a06be2-4efb-4342-85d9-dd06f80a52e7.jsonl'

declare const Bun: any

const walk = (asd: any): any => {}

await Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const file = yield* fs.readFileString(sessionPath)
  const parsed = Bun.JSONL.parse(file) as any[]

  yield* EFunction.pipe(
    parsed,
    Effect.forEach((element, index) =>
      Effect.tapError(decodeClaudeSessionLine(element), error =>
        Effect.all([
          Console.log(`Failed at ${index}/${parsed.length}`),
          // Console.log(element.message.content[0]),
          Console.dir(element, { colors: true, compact: false, depth: null }),
          // Console.log(element),
          Console.log(error.message),
          // Console.log(ParseResult.ArrayFormatter.formatErrorSync(error)),
        ]),
      ),
    ),
    Effect.andThen(Effect.log('Success 🎉')),
    Effect.ignore,
  )
}).pipe(
  Effect.provide(NodeContext.layer),
  Effect.provide(
    Logger.replace(
      Logger.defaultLogger,
      Logger.prettyLogger({ colors: true, mode: 'browser' }),
    ),
  ),

  Effect.runPromise,
)
