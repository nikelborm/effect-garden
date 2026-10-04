import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Schema from 'effect/Schema'

const EffectVoidSchema = Schema.declare(
  (u): u is Effect.Effect<void> => Effect.isEffect(u),
  { identifier: 'Effect<void>' },
)

const FiberVoidSchema = Schema.declare(
  (u): u is Fiber.Fiber<void> => Fiber.isFiber(u),
  { identifier: 'Fiber.Fiber<void>' },
)

export class CleanupFiberToolkit extends Schema.TaggedClass<CleanupFiberToolkit>()(
  'CleanupFiberToolkit',
  {
    cancelCleanup: EffectVoidSchema,
    fiberWaitingSignalToStartGarbageCollection: FiberVoidSchema,
    fiberWaitingDelayToGiveGarbageCollectionSignal: FiberVoidSchema,
    cancelDelayedCleanupSignal: EffectVoidSchema,
    cleanupImmediately: EffectVoidSchema,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
