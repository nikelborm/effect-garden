import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Latch from 'effect/Latch'
import * as Layer from 'effect/Layer'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { CleanupFiberMaker } from './CleanupFiberMaker.ts'
import { CleanupFiberToolkit } from './CleanupFiberToolkit.ts'
import type { AppPlaybackState } from './index.ts'
import { PatternPatternPatternTransitionState } from './Machine/PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransitionState } from './Machine/PatternPatternSilenceTransition.ts'
import { PatternPatternTransitionState } from './Machine/PatternPatternTransition.ts'
import { PatternSilencePatternTransitionState } from './Machine/PatternSilencePatternTransition.ts'
import { PatternSilenceTransitionState } from './Machine/PatternSilenceTransition.ts'
import { PatternState } from './Machine/Pattern⏳.ts'
import { SilenceState } from './Machine/Silence🏁.ts'
import type { DisposePlayback } from './webAudioSideEffects/DisposePlayback.ts'

export const makeCleanupFiberMakerLayer = (
  stateRef: SubscriptionRef.SubscriptionRef<AppPlaybackState>,
) =>
  Layer.sync(
    CleanupFiberMaker,
    () => (delayForSeconds: number) =>
      makeCleanupFibers(stateRef, delayForSeconds),
  )

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

  if (PatternPatternSilenceTransitionState.models(state)) {
    const q = state.transitionQueue
    yield* q[0].dispose()
    return PatternSilenceTransitionState.make({
      accord: state.accord,
      strength: state.strength,
      transitionQueue: [q[1]],
    })
  }

  if (PatternSilenceTransitionState.models(state)) {
    const q = state.transitionQueue
    yield* q[0].dispose()
    return SilenceState.make({
      accord: state.accord,
      strength: state.strength,
      transitionQueue: [],
    })
  }

  if (PatternPatternPatternTransitionState.models(state)) {
    const q = state.transitionQueue
    const [, middle, incoming] = q
    yield* q[0].dispose()
    if (
      middle._tag ===
      'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern'
    )
      return PatternPatternTransitionState.make({
        playbackStartedAtSecond: state.playbackStartedAtSecond,
        transitionQueue: [middle, incoming],
      })
    return PatternSilencePatternTransitionState.make({
      playbackStartedAtSecond: state.playbackStartedAtSecond,
      transitionQueue: [middle, incoming],
    })
  }

  if (
    PatternPatternTransitionState.models(state) ||
    PatternSilencePatternTransitionState.models(state)
  ) {
    const q = state.transitionQueue
    yield* q[0].dispose()
    return PatternState.make({
      firstPlaybackOfTheCurrentGridStartedAtSecondSinceAudioContextInit:
        state.playbackStartedAtSecond,
      transitionQueue: [q[1].becomeLive()],
    })
  }

  return state
})
