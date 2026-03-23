import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { getNewCleanedUpState } from './cleanupState.ts'
import type { AppPlaybackState, CleanupFiberToolkit } from './types.ts'

export const makeCleanupFibersFactory = (
  stateRef: SubscriptionRef.SubscriptionRef<AppPlaybackState>,
  stateSemaphore: Effect.Semaphore,
) =>
  Effect.fn('makeCleanupFibers')(function* (
    delayForSeconds: number,
  ): Effect.fn.Return<CleanupFiberToolkit> {
    const latch = yield* Effect.makeLatch()

    const fiberWaitingSignalToStartGarbageCollection = yield* stateRef.pipe(
      SubscriptionRef.updateEffect(getNewCleanedUpState),
      stateSemaphore.withPermits(1),
      latch.whenOpen,
      Effect.forkDaemon,
    )

    const fiberWaitingDelayToGiveGarbageCollectionSignal =
      yield* latch.open.pipe(
        Effect.delay(Duration.seconds(delayForSeconds)),
        Effect.forkDaemon,
      )

    const cancelDelayedCleanupSignal = Effect.asVoid(
      Fiber.interrupt(fiberWaitingDelayToGiveGarbageCollectionSignal),
    )

    const cancelCleanup = Effect.zipLeft(
      cancelDelayedCleanupSignal,
      Fiber.interrupt(fiberWaitingSignalToStartGarbageCollection),
    )

    const cleanupImmediately = cancelDelayedCleanupSignal.pipe(
      Effect.andThen(latch.open),
      Effect.andThen(fiberWaitingSignalToStartGarbageCollection.await),
      Effect.asVoid,
    )

    return {
      cancelCleanup,
      fiberWaitingSignalToStartGarbageCollection,
      fiberWaitingDelayToGiveGarbageCollectionSignal,
      cancelDelayedCleanupSignal,
      cleanupImmediately,
    } as const
  })
