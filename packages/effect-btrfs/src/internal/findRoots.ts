import {
  BadExitCodeError,
  FiniteNonNegativeIntegerFromString,
  simpleExec,
} from '@nikelborm/effect-helpers'

import * as Command from '@effect/platform/Command'
import * as Effect from 'effect/Effect'
import * as ParseResult from 'effect/ParseResult'
import * as Schema from 'effect/Schema'

import { BtrfsFindRootsError } from './Errors.ts'

export const FoundRootsSchema = Schema.Struct({
  byteNumber: FiniteNonNegativeIntegerFromString,
  generation: FiniteNonNegativeIntegerFromString,
  level: FiniteNonNegativeIntegerFromString,
}).pipe(Schema.Data, Schema.Array, Schema.Data)

export type FoundRoots = (typeof FoundRootsSchema)['Type']
export type FoundRoot = FoundRoots[number]

const decodeFoundRoots = Schema.decodeUnknownEither(FoundRootsSchema)

export interface FindRootsOptions {
  readonly devicePath: string
  readonly filterRootTreeBy?:
    | {
        /**
         * Filter root tree by it's objectid, tree root's objectid in default.
         */
        readonly treeObjectId?: number | undefined
        /**
         * Filter root tree by b-tree's level, level 0 in default.
         */
        readonly level?: number | undefined
        /**
         * Filter root tree by it's original transaction id, tree root's
         * generation in default.
         */
        readonly generation?: number | undefined
      }
    | undefined
  /**
   * It will keep searching even when the root has been already found.
   */
  readonly searchThroughAllMetadata?: boolean | undefined
}

export const findRoots = Effect.fn('effect-btrfs/Btrfs/findRoots')(
  function* (options: FindRootsOptions | string[]) {
    const { exitCode, stdout, stderr } = yield* simpleExec(
      Command.make('btrfs-find-root', ...makeFindRootsArgs(options)),
    )

    if (exitCode !== 0)
      return yield* new BadExitCodeError({ exitCode, stderr, stdout })

    const parsedRoots = yield* decodeFoundRoots(
      stdout
        .matchAll(
          /Well block (?<byteNumber>\d*)\(gen: (?<generation>\d*) level: (?<level>\d*)\)/g,
        )
        .toArray()
        .map(_ => _.groups),
    )

    const allOutputLinesCount = stdout.split('\n').filter(Boolean).length

    if (allOutputLinesCount !== parsedRoots.length)
      return yield* ParseResult.parseError(
        new ParseResult.Type(
          FoundRootsSchema.ast,
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
        new BtrfsFindRootsError({ cause, args: makeFindRootsArgs(options) }),
    ),
)

const makeFindRootsArgs = (options: FindRootsOptions | string[]) => {
  if (Array.isArray(options)) return options

  const getOption = (prefix: string, e: undefined | string) =>
    e === undefined ? [] : [prefix, e]

  return [
    ...getOption('-o', options.filterRootTreeBy?.treeObjectId?.toString()),
    ...getOption('-l', options.filterRootTreeBy?.level?.toString()),
    ...getOption('-g', options.filterRootTreeBy?.generation?.toString()),
    ...(options.searchThroughAllMetadata ? ['-a'] : []),
    options.devicePath,
  ]
}
