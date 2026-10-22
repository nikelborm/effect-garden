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

/**
 * Turns a service whose instance is a plain function into that same function,
 * so its callers don't need to `use` the service just to apply the arguments to
 * it. The returned accessor requires the service in its Effect context exactly
 * like `use` does.
 */
export const makePassthroughAccessor =
  <TShape extends EffectReturningFunction, TServiceIdentifier>(
    klass: Context.Service<TServiceIdentifier, TShape>,
  ): PassthroughAccessor<TShape, TServiceIdentifier> =>
  (...args) =>
    // @effect-diagnostics-next-line anyUnknownInErrorContext:off
    klass.use(service => service(...args))
