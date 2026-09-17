import type * as Context from 'effect/Context'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Scope from 'effect/Scope'

// TODO: heavily test

// In effect v3 this helper cloned v3's `Effect.memoize`: it forked `init` in
// the background, captured the FiberRefs/RuntimeFlags diff via
// `Effect.summarized`, then replayed the patch onto every consumer fiber so
// telemetry spans, log annotations, etc. leaked from init to consumer.
//
// In effect v4 `FiberRef`/`FiberRefs(Patch)`/`RuntimeFlags(Patch)` are gone
// (see migration/fiberref.md): fiber-local state is now `Context.Reference`
// (e.g. `References.CurrentLogSpans`), scoped via `Effect.provideService`
// instead of mutated. `Effect.cached` in v4 no longer patches anything — it
// just caches the `Exit` — and `Layer` memoization is shared across
// `Effect.provide` calls (see migration/layer-memoization.md).
//
// Because the layer builds inside `Effect.provide` in the consumer's context,
// forking `init` during the build already inherits the consumer's spans.
// Mutations `init` makes to References are scoped and don't leak, so there is
// nothing to replay. This keeps the original shape (background fork in the
// parent scope + `Deferred` join) minus the obsolete patch step.
export const makeLazyLayer = <TTagId, TSuccess, TError, TRequirements>(
  tag: Context.Service<
    TTagId,
    Effect.Effect<NoInfer<TSuccess>, NoInfer<TError>>
  >,
  init: Effect.Effect<TSuccess, TError, TRequirements>,
) =>
  Effect.gen(function* () {
    const deferred = yield* Deferred.make<TSuccess, TError>()

    const scope = yield* Effect.scope

    yield* init.pipe(
      Scope.provide(scope),
      Deferred.into(deferred),
      Effect.forkScoped,
    )

    return Deferred.await(deferred)
  }).pipe(Layer.effect(tag))
Effect.cached
