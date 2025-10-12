import * as Args from '@effect/cli/Args'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'

export const withResolvedToAbsolutePathArg = (self: Args.Args<string>) =>
  Args.mapEffect(self, relativePath =>
    Effect.map(Path.Path, path => path.resolve(relativePath)),
  )
