import * as FileSystem from '@effect/platform/FileSystem'
import * as NodeContext from '@effect/platform-node/NodeContext'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Logger from 'effect/Logger'

import {
  type AssistantMessage,
  decodeClaudeSession,
  decodeClaudeSessionLine,
} from './claude-session-reader-schema.ts'

// TODO: Test recursively on other `.jsonl` files in that folder.

const sessionPath =
  '/home/nikel/.claude/projects/-home-nikel-projects-extension-json-schema-offline/87a06be2-4efb-4342-85d9-dd06f80a52e7.jsonl'

// TODO: maybe make PR into https://github.com/effect-anything/session-mind

declare const Bun: any

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
          Console.dir(element, { colors: true, compact: false, depth: null }),
          Console.log(error.message),
        ]),
      ),
    ),
    Effect.andThen(Effect.log('Success 🎉')),
    Effect.ignore,
  )
  const validated = yield* decodeClaudeSession(parsed)

  yield* Console.log(
    validated
      .filter(
        (e): e is (typeof AssistantMessage)['Type'] => e.type === 'assistant',
      )
      .flatMap(e => e.message.content)
      .filter(e => e.type === 'tool_use' && e.name === 'Bash')
      .map(e => e.input)
      .map(e => `$ ${e.command}\n  ${e.description}\n`)
      .join('\n'),
  )
}).pipe(
  Effect.provide(NodeContext.layer),
  Effect.provide(
    Logger.replace(
      Logger.defaultLogger,
      Logger.prettyLogger({ colors: true, mode: 'browser' }),
    ),
  ),
  // TODO: make custom runtime
  // https://typeonce.dev/course/effect-beginners-complete-getting-started/effect-in-production/most-common-effect-patterns#use-a-custom-runtime-from-the-beginning
  Effect.runPromise,
)
