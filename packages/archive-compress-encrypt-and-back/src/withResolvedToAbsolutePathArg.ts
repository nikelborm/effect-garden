import * as Args from '@effect/cli/Args'
import * as Path from '@effect/platform/Path'
import type * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'

export const withResolvedToAbsolutePathArg = <A extends string>(
  self: Args.Args<A>,
) =>
  Args.mapEffect(self, relativePath =>
    Effect.map(
      Path.Path,
      path => path.resolve(relativePath) as A & Brand.Brand<'Absolute'>,
    ),
  )
