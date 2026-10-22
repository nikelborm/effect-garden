import type * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

export type EffectReturningFunction = (
  ...args: ReadonlyArray<any>
) => Effect.Effect<any, any, any>

export interface PassthroughAccessor<
  TShape extends EffectReturningFunction,
  TServiceIdentifier,
> {
  (
    ...args: Parameters<TShape>
  ): Effect.Effect<
    Effect.Success<ReturnType<TShape>>,
    Effect.Error<ReturnType<TShape>>,
    Effect.Services<ReturnType<TShape>> | TServiceIdentifier
  >
}

export const makePassthroughAccessor =
  <TShape extends EffectReturningFunction, TServiceIdentifier>(
    klass: Context.Service<TServiceIdentifier, TShape>,
  ): PassthroughAccessor<TShape, TServiceIdentifier> =>
  (...args) =>
    // @effect-diagnostics-next-line anyUnknownInErrorContext:off
    klass.use(service => service(...args))
