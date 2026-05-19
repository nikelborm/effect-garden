import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

export const LogObjectPrettyEffect = (item: unknown) =>
  Console.dir(item, { colors: true, compact: false, depth: null })

export const LogSuccessObjectPretty = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  Effect.tap(self, LogObjectPrettyEffect)

export const LogErrorObjectPretty = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  Effect.tapError(self, LogObjectPrettyEffect)

export const TapLogBoth = EFunction.flow(
  LogSuccessObjectPretty,
  LogErrorObjectPretty,
)

export const logObjectPretty = (item: unknown) =>
  console.dir(item, { colors: true, compact: false, depth: null })
