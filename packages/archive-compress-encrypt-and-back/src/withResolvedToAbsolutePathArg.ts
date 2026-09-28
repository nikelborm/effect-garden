import type * as Brand from 'effect/Brand'
import * as Argument from 'effect/cli/Argument'
import * as Path from 'effect/Path'

export const withResolvedToAbsolutePathArg = <A extends string>(
  self: Argument.Argument<A>,
) =>
  Argument.mapEffect(self, relativePath =>
    Path.Path.useSync(
      path => path.resolve(relativePath) as Brand.Branded<A, 'Absolute'>,
    ),
  )
