import type * as Context from 'effect/Context'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as FiberRefsPatch from 'effect/FiberRefsPatch'
import * as Layer from 'effect/Layer'
import * as RuntimeFlags from 'effect/RuntimeFlags'
import type * as RuntimeFlagsPatch from 'effect/RuntimeFlagsPatch'
import * as Scope from 'effect/Scope'

const refsAndFlags = Effect.all({
  refs: Effect.getFiberRefs,
  flags: Effect.getRuntimeFlags,
})

export const makeLazyLayer = <TTagId, TSuccess, TError, TRequirements>(
  tag: Context.Tag<TTagId, Effect.Effect<NoInfer<TSuccess>, NoInfer<TError>>>,
  init: Effect.Effect<TSuccess, TError, TRequirements>,
) =>
  Effect.gen(function* () {
    type DeferredSuccess = [
      {
        readonly fiberRefPatch: FiberRefsPatch.FiberRefsPatch
        readonly runtimeFlagsPatch: RuntimeFlagsPatch.RuntimeFlagsPatch
      },
      TSuccess,
    ]
    const deferred = yield* Deferred.make<DeferredSuccess, TError>()

    const scope = yield* Effect.scope

    yield* init.pipe(
      Scope.extend(scope),
      Effect.summarized(refsAndFlags, (before, after) => ({
        fiberRefPatch: FiberRefsPatch.diff(before.refs, after.refs),
        runtimeFlagsPatch: RuntimeFlags.diff(before.flags, after.flags),
      })),
      Effect.intoDeferred(deferred),
      Effect.forkScoped,
    )

    return Deferred.await(deferred).pipe(
      Effect.flatMap(([{ fiberRefPatch, runtimeFlagsPatch }, success]) =>
        Effect.all([
          Effect.patchFiberRefs(fiberRefPatch),
          Effect.patchRuntimeFlags(runtimeFlagsPatch),
        ]).pipe(Effect.as(success)),
      ),
    )
  }).pipe(Layer.scoped(tag))
