import type * as Effect from 'effect/Effect'
import type * as Fiber from 'effect/Fiber'

import type { CurrentSelectedAsset } from '../CurrentlySelectedAssetState.ts'

export type AudioPlayback = {
  readonly bufferSource: AudioBufferSourceNode
  readonly gainNode: GainNode
}

export interface CleanupFiberToolkit {
  readonly cancelCleanup: Effect.Effect<void>
  readonly fiberWaitingSignalToStartGarbageCollection: Fiber.RuntimeFiber<void>
  readonly fiberWaitingDelayToGiveGarbageCollectionSignal: Fiber.RuntimeFiber<void>
  readonly cancelDelayedCleanupSignal: Effect.Effect<void>
  readonly cleanupImmediately: Effect.Effect<void>
}

export interface LoopTransitionQueueElement {
  readonly asset: CurrentSelectedAsset
  readonly playback: AudioPlayback
}

export interface LoopTransitionElementWithScheduledCleanup
  extends LoopTransitionQueueElement {
  readonly cleanupFiberToolkit: CleanupFiberToolkit
  readonly fadeoutStartsAtSecond: number
  readonly fadeoutEndsAtSecond: number
}

export interface SlowStrumTransitionQueueElement {
  readonly asset: CurrentSelectedAsset
  readonly playback: AudioPlayback
  readonly durationSeconds: number
}

export interface NotPlaying {
  readonly _tag: 'NotPlaying'
}

export interface PlayingSlowStrum {
  readonly _tag: 'PlayingSlowStrum'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [SlowStrumTransitionQueueElement]
}

export interface ScheduledSlowStrumToLoopTransition {
  readonly _tag: 'ScheduledSlowStrumToLoopTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    SlowStrumTransitionQueueElement,
    LoopTransitionQueueElement,
  ]
}

export interface PlayingLoop {
  readonly _tag: 'PlayingLoop'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [LoopTransitionQueueElement]
}

export interface ScheduledLoopToAnotherLoopTransition {
  readonly _tag: 'ScheduledLoopToAnotherLoopTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionQueueElement,
  ]
}

export interface ScheduledLoopToSilenceTransition {
  readonly _tag: 'ScheduledLoopToSilenceTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [LoopTransitionElementWithScheduledCleanup]
}

export interface InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop {
  readonly _tag: 'InProgressLoopToAnotherLoopTransitionWithScheduledChangeToYetAnotherLoop'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionQueueElement,
  ]
}

export interface InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence {
  readonly _tag: 'InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionElementWithScheduledCleanup,
  ]
}

export type PlayingAppPlaybackStates =
  | PlayingLoop
  | PlayingSlowStrum
  | ScheduledLoopToAnotherLoopTransition
  | ScheduledLoopToSilenceTransition
  | ScheduledSlowStrumToLoopTransition
  | InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop
  | InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence

export type AppPlaybackState = NotPlaying | PlayingAppPlaybackStates
