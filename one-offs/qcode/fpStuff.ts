import * as Effect from 'effect/Effect'
import type { Kind, TypeClass, TypeLambda } from 'effect/HKT'
import * as Stream from 'effect/Stream'

export type Kind3<F extends TypeLambda, A, E, R> = Kind<F, never, R, E, A>

export interface TapError<F extends TypeLambda> extends TypeClass<F> {
  tapError<A, E, R, X, E2, R2>(
    self: Kind<F, never, R, E, A>,
    f: (e: NoInfer<E>) => Effect.Effect<X, E2, R2>,
  ): Kind<F, never, R | R2, E | E2, A>
  tapError<E, X, E2, R2>(
    f: (e: NoInfer<E>) => Effect.Effect<X, E2, R2>,
  ): <A, R>(self: Kind<F, never, R, E, A>) => Kind<F, never, R | R2, E | E2, A>
}

export interface FlatMap<F extends TypeLambda> extends TypeClass<F> {
  flatMap<R1, O1, E1, A, R2, O2, E2, B>(
    self: Kind<F, R1, O1, E1, A>,
    f: (a: A) => Kind<F, R2, O2, E2, B>,
  ): Kind<F, R1 | R2, O1 | O2, E1 | E2, B>
  flatMap<A, R2, O2, E2, B>(
    f: (a: A) => Kind<F, R2, O2, E2, B>,
  ): <R1, O1, E1>(
    self: Kind<F, R1, O1, E1, A>,
  ) => Kind<F, R1 | R2, O1 | O2, E1 | E2, B>
}

export interface FromEffect<F extends TypeLambda> extends TypeClass<F> {
  fromEffect<A, E, R>(self: Effect.Effect<A, E, R>): Kind<F, never, R, E, A>
}

export interface UnifiedTypeClass<F extends TypeLambda>
  extends FlatMap<F>,
    TapError<F>,
    FromEffect<F> {}

export const EffectUnified: UnifiedTypeClass<Effect.EffectTypeLambda> = {
  flatMap: Effect.flatMap,
  tapError: Effect.tapError,
  fromEffect: x => x,
}

export const StreamUnified: UnifiedTypeClass<Stream.StreamTypeLambda> = Stream
