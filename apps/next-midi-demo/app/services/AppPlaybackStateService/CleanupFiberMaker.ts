import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Latch from 'effect/Latch'
import * as Layer from 'effect/Layer'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { CleanupFiberToolkit } from './CleanupFiberToolkit.ts'
import type { AppPlaybackState } from './types/index.ts'
import {
  FullLoopState,
  LoopRolloverHandoverState,
  LoopSilenceHandoverState,
  PlayingLoopState,
} from './types/LoopBoundPlayback.ts'
import {
  LoopFadingToSilenceState,
  PureSilenceState,
  TwoLoopsFadingToSilenceState,
} from './types/SilenceBoundPlayback.ts'
import type { DisposePlayback } from './webAudioSideEffects/index.ts'

export class CleanupFiberMaker extends Context.Service<
  CleanupFiberMaker,
  (
    delayForSeconds: number,
  ) => Effect.Effect<CleanupFiberToolkit, never, DisposePlayback>
>()('next-midi-demo/CleanupFiberMaker') {
  static layer = (
    stateRef: SubscriptionRef.SubscriptionRef<AppPlaybackState>,
  ) =>
    Layer.sync(
      CleanupFiberMaker,
      () => (delayForSeconds: number) =>
        makeCleanupFibers(stateRef, delayForSeconds),
    )
}

const makeCleanupFibers = Effect.fn('makeCleanupFibers')(function* (
  stateRef: SubscriptionRef.SubscriptionRef<AppPlaybackState>,
  delayForSeconds: number,
): Effect.fn.Return<CleanupFiberToolkit, never, DisposePlayback> {
  const latch = yield* Latch.make()

  const fiberWaitingSignalToStartGarbageCollection = yield* stateRef.pipe(
    SubscriptionRef.updateEffect(getNewCleanedUpState),
    latch.whenOpen,
    Effect.forkDetach,
  )

  const fiberWaitingDelayToGiveGarbageCollectionSignal = yield* latch.open.pipe(
    Effect.delay(Duration.seconds(delayForSeconds)),
    Effect.asVoid,
    Effect.forkDetach,
  )

  const cancelDelayedCleanupSignal: Effect.Effect<void> = Fiber.interrupt(
    fiberWaitingDelayToGiveGarbageCollectionSignal,
  )

  const cancelCleanup = Effect.andThen(
    cancelDelayedCleanupSignal,
    Fiber.interrupt(fiberWaitingSignalToStartGarbageCollection),
  )

  const cleanupImmediately = cancelDelayedCleanupSignal.pipe(
    Effect.andThen(latch.open),
    Effect.andThen(Fiber.await(fiberWaitingSignalToStartGarbageCollection)),
    Effect.asVoid,
  )

  return CleanupFiberToolkit.make({
    cancelCleanup,
    fiberWaitingSignalToStartGarbageCollection,
    fiberWaitingDelayToGiveGarbageCollectionSignal,
    cancelDelayedCleanupSignal,
    cleanupImmediately,
  })
})

const getNewCleanedUpState = Effect.fn('getNewCleanedUpState')(function* (
  state: AppPlaybackState,
): Effect.fn.Return<AppPlaybackState, never, DisposePlayback> {
  yield* Effect.logTrace('Playback cleanup')

  if (TwoLoopsFadingToSilenceState.models(state)) {
    const q = state.transitionQueue
    yield* q[0].dispose()
    return LoopFadingToSilenceState.make({
      accord: state.accord,
      strength: state.strength,
      transitionQueue: [q[1]],
    })
  }

  if (LoopFadingToSilenceState.models(state)) {
    const q = state.transitionQueue
    yield* q[0].dispose()
    return PureSilenceState.make({
      accord: state.accord,
      strength: state.strength,
      transitionQueue: [],
    })
  }

  if (FullLoopState.models(state)) {
    const q = state.transitionQueue
    const [, middle, incoming] = q
    yield* q[0].dispose()
    if (
      middle._tag === 'LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop'
    )
      return LoopRolloverHandoverState.make({
        playbackStartedAtSecond: state.playbackStartedAtSecond,
        transitionQueue: [middle, incoming],
      })
    return LoopSilenceHandoverState.make({
      playbackStartedAtSecond: state.playbackStartedAtSecond,
      transitionQueue: [middle, incoming],
    })
  }

  if (
    LoopRolloverHandoverState.models(state) ||
    LoopSilenceHandoverState.models(state)
  ) {
    const q = state.transitionQueue
    yield* q[0].dispose()
    return PlayingLoopState.make({
      playbackStartedAtSecond: state.playbackStartedAtSecond,
      transitionQueue: [q[1].becomeLive()],
    })
  }

  return state
})
