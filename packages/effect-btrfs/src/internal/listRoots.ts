/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import {
  BadExitCodeError,
  FiniteNonNegativeIntegerFromString,
  simpleExec,
} from '@nikelborm/effect-helpers'

import * as Command from '@effect/platform/Command'
import * as Effect from 'effect/Effect'
import * as ParseResult from 'effect/ParseResult'
import * as Schema from 'effect/Schema'

import { BtrfsListRootsError } from './Errors.ts'

export const ListedRootItemsSchema = Schema.Struct({
  treeObjectId: Schema.Union(
    FiniteNonNegativeIntegerFromString,
    Schema.NonEmptyTrimmedString,
  ),
  keyOffset: FiniteNonNegativeIntegerFromString,
  byteNumber: FiniteNonNegativeIntegerFromString,
  treeLevel: FiniteNonNegativeIntegerFromString,
}).pipe(Schema.Data, Schema.Array, Schema.Data)

export const decodeListedRootItems = Schema.decodeUnknownEither(
  ListedRootItemsSchema,
)

export interface ListRootsOptions {
  readonly devicePath: string
  readonly ignoreErrors?: boolean | undefined
  readonly goIntoSnapshots?: boolean | undefined
  readonly treeByteNumber?: number | undefined
}

export const listRoots = Effect.fn('effect-btrfs/Btrfs/listRoots')(
  function* (options: ListRootsOptions | string[]) {
    const { exitCode, stdout, stderr } = yield* simpleExec(
      Command.make(
        'btrfs',
        'restore',
        '--list-roots',
        ...makeListRootsArgs(options),
      ),
    )

    if (exitCode !== 0)
      return yield* new BadExitCodeError({ exitCode, stderr, stdout })

    const parsedRoots = yield* decodeListedRootItems(
      stdout
        .matchAll(
          / tree key \((?<treeObjectId>[A-Z\d_]*) ROOT_ITEM (?<keyOffset>\d*)\) (?<byteNumber>\d*) level (?<treeLevel>\d*)/g,
        )
        .toArray()
        .map(_ => _.groups),
    )

    const allOutputLinesCount = stdout.split('\n').filter(Boolean).length

    if (allOutputLinesCount !== parsedRoots.length)
      return yield* ParseResult.parseError(
        new ParseResult.Type(
          ListedRootItemsSchema.ast,
          stdout,
          'Some of the non-empty lines are not parseable by regexp',
        ),
      )

    return parsedRoots
  },
  (result, options) =>
    Effect.mapError(
      result,
      cause =>
        new BtrfsListRootsError({ cause, args: makeListRootsArgs(options) }),
    ),
)

const makeListRootsArgs = (options: ListRootsOptions | string[]) => {
  if (Array.isArray(options)) return options

  const getOption = (prefix: string, e: undefined | string) =>
    e === undefined ? [] : [prefix, e]

  return [
    ...getOption('-t', options.treeByteNumber?.toString()),
    ...(options.ignoreErrors ? ['--ignore-errors'] : []),
    ...(options.goIntoSnapshots ? ['--snapshots'] : []),
    options.devicePath,
  ]
}
