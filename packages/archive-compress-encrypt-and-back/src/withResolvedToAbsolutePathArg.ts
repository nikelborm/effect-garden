import * as Args from '@effect/cli/Args'
import type * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as Path from 'effect/Path'

export const withResolvedToAbsolutePathArg = <A extends string>(
  self: Args.Args<A>,
) =>
  Args.mapEffect(self, relativePath =>
    Effect.map(
      Path.Path,
      path => path.resolve(relativePath) as Brand.Branded<A, 'Absolute'>,
    ),
  )
