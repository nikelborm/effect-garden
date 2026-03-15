import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as EArray from 'effect/Array'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Fiber from 'effect/Fiber'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'
import * as SubscriptionRef from 'effect/SubscriptionRef'
import * as Tuple from 'effect/Tuple'
import * as ETuple from 'effect/Tuple'

import {
  getLocalAssetFileName,
  type Strength,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../audioAssetHelpers.ts'
import { getFileHandle, readFileBuffer } from '../opfs.ts'
import type { AllAccordUnion } from './AccordRegistry.ts'
import {
  CurrentlySelectedAssetState,
  type CurrentSelectedAsset,
} from './CurrentlySelectedAssetState.ts'
import type { AllPatternUnion } from './PatternRegistry.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

export class AppPlaybackStateService extends Effect.Service<AppPlaybackStateService>()(
  'next-midi-demo/AppPlaybackStateService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const audioContext = yield* EAudioContext.make()
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const selectedAssetState = yield* CurrentlySelectedAssetState
      const stateSemaphore = yield* Effect.makeSemaphore(1)

      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>({
        _tag: 'NotPlaying',
      })

      const getAudioBufferOfAsset = Effect.fn('getAudioBufferOfAsset')(
        function* ({ accord, pattern, strength }: CurrentSelectedAsset) {
          const pointer = Option.match(pattern, {
            onNone: () =>
              new TaggedSlowStrumPointer({
                accordIndex: accord.index,
                strength,
              }),
            onSome: p =>
              new TaggedPatternPointer({
                accordIndex: accord.index,
                patternIndex: p.index,
                strength,
              }),
          })
          const assetFileHandle = yield* getFileHandle({
            dirHandle: rootDirectoryHandle,
            fileName: getLocalAssetFileName(pointer),
          })

          const fileArrayBuffer = yield* readFileBuffer(assetFileHandle)

          return yield* EAudioContext.decodeAudioData(
            audioContext,
            fileArrayBuffer,
          )
        },
      )

      const makeNewPlayingAssetState = Effect.gen(function* () {
        if (!(yield* selectedAssetState.isFinishedDownloadCompletely))
          return yield* Effect.die(
            'Play command should only be called when the current asset finished loading',
          )

        const currentAsset = yield* selectedAssetState.current

        const audioBuffer = yield* getAudioBufferOfAsset(currentAsset)

        const secondsSinceAudioContextInit =
          yield* EAudioContext.currentTime(audioContext)

        const currentPlayback = yield* createLoopingPlayback(
          audioContext,
          audioBuffer,
        )

        yield* Effect.sync(() => {
          currentPlayback.gainNode.gain.setValueAtTime(
            maxLoudness,
            asEarlyAsPossibleInSeconds,
          )
          currentPlayback.bufferSource.start(secondsSinceAudioContextInit)
        })

        yield* Effect.log('started playing')

        return {
          _tag: 'PlayingLoop' as const,
          transitionQueue: [{ playback: currentPlayback, asset: currentAsset }],
          playbackStartedAtSecond: secondsSinceAudioContextInit,
        } satisfies PlayingLoop
      })

      const cleanupAllPlaybacks = Effect.fn(function* (
        state: PlayingAppPlaybackStates,
      ) {
        const secondsSinceAudioContextInit =
          yield* EAudioContext.currentTime(audioContext)

        yield* Effect.forEach(
          state.transitionQueue.map(_ => _.playback),
          playback => {
            playback.gainNode.gain.exponentialRampToValueAtTime(
              minLoudness,
              secondsSinceAudioContextInit + transitionTimeInSeconds,
            )

            return helpGarbageCollectionOfPlayback(playback).pipe(
              Effect.delay(Duration.seconds(transitionTimeInSeconds + 0.1)),
            )
          },
          { discard: true },
        ).pipe(Effect.tapErrorCause(Effect.logError), Effect.forkDaemon)
      })

      const switchPlayPauseFromCurrentlySelected = SubscriptionRef.updateEffect(
        stateRef,
        Effect.fn(function* (state) {
          yield* Effect.log('Switch play pause from currently selected')
          const isStopped = state._tag === 'NotPlaying'
          if (isStopped) return yield* makeNewPlayingAssetState

          yield* cleanupAllPlaybacks(state)

          return { _tag: 'NotPlaying' as const }
        }),
      ).pipe(
        stateSemaphore.withPermits(1),
        Effect.tapErrorCause(Effect.logError),
      )

      yield* Effect.addFinalizer(() =>
        Effect.map(stateRef.get, state =>
          state._tag === 'NotPlaying'
            ? Effect.void
            : cleanupAllPlaybacks(state),
        ),
      )

      const makeCleanupFibers = Effect.fn('makeCleanupFibers')(function* (
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

      const reschedulePlayback = Effect.fn('reschedulePlayback')(function* (
        oldState: AppPlaybackState,
        asset: CurrentSelectedAsset,
      ) {
        if (oldState._tag === 'NotPlaying') return oldState

        if (oldState._tag === 'PlayingLoop') {
          const [current] = oldState.transitionQueue

          if (Equal.equals(current.asset, asset)) return oldState

          const audioBuffer = yield* getAudioBufferOfAsset(asset)

          const math = calcTimingsMath(
            oldState.playbackStartedAtSecond,
            yield* EAudioContext.currentTime(audioContext),
          )

          yield* scheduleFadeOutOf(current.playback, math)

          return {
            _tag: 'ScheduledLoopToAnotherLoopTransition' as const,
            playbackStartedAtSecond: oldState.playbackStartedAtSecond,
            transitionQueue: [
              {
                ...current,
                cleanupFiberToolkit: yield* makeCleanupFibers(
                  math.secondsSinceNowUpUntilFadeoutEnds,
                ),
                fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
                fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
              },
              {
                asset,
                playback: yield* createScheduledNextPlayback(
                  audioContext,
                  audioBuffer,
                  math,
                ),
              },
            ],
          } satisfies PlayingAppPlaybackStates
        }
        if (oldState._tag === 'ScheduledLoopToAnotherLoopTransition') {
          const current = oldState.transitionQueue[0]
          const latest = oldState.transitionQueue[1]
          if (Equal.equals(latest.asset, asset)) return oldState

          const secondsSinceAudioContextInit =
            yield* EAudioContext.currentTime(audioContext)

          const math = calcTimingsMath(
            oldState.playbackStartedAtSecond,
            secondsSinceAudioContextInit,
          )

          if (
            math.fitsIntoBufferOfClosestTransition &&
            Equal.equals(current.asset, asset)
          ) {
            yield* Effect.sync(() => {
              current.playback.gainNode.gain.cancelScheduledValues(
                secondsSinceAudioContextInit,
              )
              current.playback.gainNode.gain.setValueAtTime(
                maxLoudness,
                secondsSinceAudioContextInit,
              )
            })
            yield* current.cleanupFiberToolkit.cancelCleanup
            yield* helpGarbageCollectionOfPlayback(latest.playback)
            return {
              _tag: 'PlayingLoop',
              playbackStartedAtSecond: oldState.playbackStartedAtSecond,
              transitionQueue: [Struct.pick(current, 'asset', 'playback')],
            } satisfies PlayingLoop
          }

          const audioBuffer = yield* getAudioBufferOfAsset(asset)
          const playback = yield* createScheduledNextPlayback(
            audioContext,
            audioBuffer,
            math,
          )

          if (!math.fitsIntoBufferOfClosestTransition) {
            yield* scheduleFadeOutOf(latest.playback, math)
            return {
              _tag: 'InProgressLoopToAnotherLoopTransitionWithScheduledChangeToYetAnotherLoop' as const,
              playbackStartedAtSecond: oldState.playbackStartedAtSecond,
              transitionQueue: [
                current,
                {
                  ...latest,
                  fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
                  fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
                  cleanupFiberToolkit: yield* makeCleanupFibers(
                    math.secondsSinceNowUpUntilFadeoutEnds,
                  ),
                },
                { asset, playback },
              ],
            } satisfies PlayingAppPlaybackStates
          }

          return {
            _tag: 'ScheduledLoopToAnotherLoopTransition' as const,
            playbackStartedAtSecond: oldState.playbackStartedAtSecond,
            transitionQueue: [current, { asset, playback }],
          } satisfies PlayingAppPlaybackStates
        }
        return oldState
      })

      const isPlaying = (current: AppPlaybackState) =>
        current._tag !== 'NotPlaying'

      const latestIsPlayingFlagStream = yield* stateRef.changes.pipe(
        Stream.map(isPlaying),
        Stream.changes,
        Stream.rechunk(1),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      const playStopButtonPressableFlagChangesStream = yield* EFunction.pipe(
        latestIsPlayingFlagStream,
        Stream.flatMap(
          isPlaying =>
            isPlaying
              ? Stream.succeed(true)
              : selectedAssetState.isFinishedDownloadCompletelyFlagChangesStream,
          { switch: true, concurrency: 1 },
        ),
        Stream.changes,
        Stream.rechunk(1),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      yield* selectedAssetState.changes.pipe(
        Stream.tap(asset =>
          stateRef.pipe(
            SubscriptionRef.updateEffect(state =>
              reschedulePlayback(state, asset),
            ),
            stateSemaphore.withPermits(1),
          ),
        ),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      return {
        playStopButtonPressableFlagChangesStream,
        switchPlayPauseFromCurrentlySelected,
        latestIsPlayingFlagStream,
        playbackPublicInfoChangesStream: Stream.map(stateRef.changes, state =>
          state._tag === 'NotPlaying'
            ? state
            : ({
                _tag: state._tag,
                currentAsset: state.transitionQueue[0].asset,
                assetTransitionsQueue: Tuple.map(
                  state.transitionQueue,
                  a => a.asset,
                ),
              } as const),
        ),
      }
    }),
  },
) {}

const createPlayback = (
  eAudioContext: EAudioContext.Instance,
  eAudioBuffer: EAudioBuffer.EAudioBuffer,
) =>
  Effect.sync(() => {
    const audioBufferImplHack = eAudioBuffer as EAudioBuffer.EAudioBuffer & {
      _audioBuffer: AudioBuffer
    }
    const audioContextImplHack = eAudioContext as EAudioContext.Instance & {
      _audioContext: AudioContext
    }
    const audioContext = audioContextImplHack._audioContext
    const bufferSource = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()
    bufferSource.buffer = audioBufferImplHack._audioBuffer
    bufferSource.connect(gainNode)

    gainNode.connect(audioContext.destination)

    return { bufferSource, gainNode } as const
  })

const createLoopingPlayback = EFunction.flow(
  createPlayback,
  Effect.map(pb => {
    pb.bufferSource.loop = true
    return pb
  }),
)

const scheduleFadeOutOf = (
  playback: AudioPlayback,
  math: ReturnType<typeof calcTimingsMath>,
) =>
  Effect.sync(() => {
    playback.gainNode.gain.setValueAtTime(
      maxLoudness,
      math.playbackFadeoutStartsAt,
    )
    playback.gainNode.gain.exponentialRampToValueAtTime(
      minLoudness,
      math.playbackFadeoutEndsAt,
    )
  })

const createScheduledNextPlayback = (
  audioContext: EAudioContext.Instance,
  audioBuffer: EAudioBuffer.EAudioBuffer,
  math: ReturnType<typeof calcTimingsMath>,
) =>
  Effect.map(createLoopingPlayback(audioContext, audioBuffer), pb => {
    pb.gainNode.gain.setValueAtTime(minLoudness, asEarlyAsPossibleInSeconds)
    pb.gainNode.gain.setValueAtTime(minLoudness, math.playbackFadeoutStartsAt)
    pb.gainNode.gain.exponentialRampToValueAtTime(
      maxLoudness,
      math.playbackFadeoutEndsAt,
    )
    pb.bufferSource.start(
      math.secondsSinceAudioContextInit,
      math.secondsSinceLatestTrackLoopStart,
    )
    return pb
  })

const transitionTimeInSeconds = 0.001
// little time-buffer to actually execute all of the scheduling of
// cleanups and also to account the disgusting fucked-up absence of the
// fucking precision of audioContext.currentTime. Fingerprinting they
// say...
// https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime#reduced_time_precision
const schedulingSafeBufferInSeconds = 0.03
const maxLoudness = 1
const minLoudness = 0.001
const asEarlyAsPossibleInSeconds = 0
const ticksPerTrack = 8
const tickSizeInSeconds = 1
const trackSizeInSeconds = ticksPerTrack * tickSizeInSeconds

const calcTimingsMath = (
  playbackStartedAtSecond: number,
  secondsSinceAudioContextInit: number,
) => {
  const secondsPassedSincePlaybackStart =
    secondsSinceAudioContextInit - playbackStartedAtSecond

  const ticksPassedSincePlaybackStart =
    secondsPassedSincePlaybackStart / tickSizeInSeconds

  const secondsSinceLatestTrackLoopStart =
    secondsPassedSincePlaybackStart % trackSizeInSeconds

  let nextAdjustedTickIndexSincePlaybackStart = Math.ceil(
    ticksPassedSincePlaybackStart,
  )

  let nextAdjustedTickStartsAtSecondsSincePlaybackStart =
    nextAdjustedTickIndexSincePlaybackStart * tickSizeInSeconds

  let nextAdjustedTickStartsAtSecondsSinceAudioContextInit =
    playbackStartedAtSecond + nextAdjustedTickStartsAtSecondsSincePlaybackStart

  let playbackFadeoutStartsAt =
    nextAdjustedTickStartsAtSecondsSinceAudioContextInit -
    transitionTimeInSeconds

  let playbackFadeoutEndsAt =
    nextAdjustedTickStartsAtSecondsSinceAudioContextInit

  let secondsSinceNowUpUntilFadeoutEnds =
    playbackFadeoutEndsAt - secondsSinceAudioContextInit

  const fitsIntoBufferOfClosestTransition =
    secondsSinceAudioContextInit <=
    playbackFadeoutStartsAt - schedulingSafeBufferInSeconds

  if (!fitsIntoBufferOfClosestTransition) {
    nextAdjustedTickIndexSincePlaybackStart += 1
    nextAdjustedTickStartsAtSecondsSincePlaybackStart += tickSizeInSeconds
    nextAdjustedTickStartsAtSecondsSinceAudioContextInit += tickSizeInSeconds
    playbackFadeoutStartsAt += tickSizeInSeconds
    playbackFadeoutEndsAt += tickSizeInSeconds
    secondsSinceNowUpUntilFadeoutEnds += tickSizeInSeconds
  }

  return {
    fitsIntoBufferOfClosestTransition,
    secondsSinceAudioContextInit,
    secondsPassedSincePlaybackStart,
    nextAdjustedTickIndexSincePlaybackStart,
    nextAdjustedTickStartsAtSecondsSincePlaybackStart,
    nextAdjustedTickStartsAtSecondsSinceAudioContextInit,
    playbackFadeoutStartsAt,
    playbackFadeoutEndsAt,
    secondsSinceLatestTrackLoopStart,
    secondsSinceNowUpUntilFadeoutEnds,
  } as const
}

const helpGarbageCollectionOfPlayback = ({
  bufferSource,
  gainNode,
}: AudioPlayback) =>
  Effect.sync(() => {
    bufferSource.stop()
    bufferSource.disconnect()
    gainNode.gain.cancelScheduledValues(0)
    gainNode.disconnect()
  })

const getNewCleanedUpState = Effect.fn('getNewCleanedUpState')(function* (
  stateRightBeforeCleanup: AppPlaybackState,
): Effect.fn.Return<AppPlaybackState> {
  yield* Effect.logTrace('Playback cleanup')

  if (stateRightBeforeCleanup._tag === 'ScheduledLoopToAnotherLoopTransition') {
    const [old, target] = stateRightBeforeCleanup.transitionQueue
    yield* helpGarbageCollectionOfPlayback(old.playback)
    return {
      _tag: 'PlayingLoop' as const,
      playbackStartedAtSecond: stateRightBeforeCleanup.playbackStartedAtSecond,
      transitionQueue: [target],
    }
  }

  if (
    stateRightBeforeCleanup._tag ===
    'InProgressLoopToAnotherLoopTransitionWithScheduledChangeToYetAnotherLoop'
  ) {
    const [oldest, middle, target] = stateRightBeforeCleanup.transitionQueue
    yield* helpGarbageCollectionOfPlayback(oldest.playback)
    return {
      _tag: 'ScheduledLoopToAnotherLoopTransition' as const,
      playbackStartedAtSecond: stateRightBeforeCleanup.playbackStartedAtSecond,
      transitionQueue: [middle, target],
    }
  }

  return stateRightBeforeCleanup
})

export type AudioPlayback = {
  readonly bufferSource: AudioBufferSourceNode
  readonly gainNode: GainNode
}

export type PlayingAppPlaybackStates =
  | PlayingLoop
  | ScheduledLoopToAnotherLoopTransition
  | ScheduledLoopToSilenceTransition
  | InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop
  | InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence

export type AppPlaybackState = NotPlaying | PlayingAppPlaybackStates

export interface NotPlaying {
  readonly _tag: 'NotPlaying'
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

interface CleanupFiberToolkit {
  readonly cancelCleanup: Effect.Effect<void>
  readonly fiberWaitingSignalToStartGarbageCollection: Fiber.RuntimeFiber<void>
  readonly fiberWaitingDelayToGiveGarbageCollectionSignal: Fiber.RuntimeFiber<void>
  readonly cancelDelayedCleanupSignal: Effect.Effect<void>
  readonly cleanupImmediately: Effect.Effect<void>
}

// interface SA<S extends Strength, A extends AllAccordUnion> {
//   readonly strength: S
//   readonly accord: A
// }

// interface SAP<
//   S extends Strength,
//   A extends AllAccordUnion,
//   P extends AllPatternUnion,
// > extends SA<S, A> {
//   readonly pattern: P
// }

// // Distributed 2 parameters
// type PossibleStrengthWithAccordCombinations = Strength extends infer S
//   ? AllAccordUnion extends infer A
//     ? S extends Strength
//       ? A extends AllAccordUnion
//         ? SA<S, A>
//         : never
//       : never
//     : never
//   : never

// type PossibleLoops =
//   PossibleStrengthWithAccordCombinations extends SA<infer S, infer A>
//     ? AllPatternUnion extends infer P
//       ? S extends any
//         ? A extends any
//           ? P extends AllPatternUnion
//             ? SAP<S, A, P>
//             : never
//           : never
//         : never
//       : never
//     : never

// type PossibleSingleShotSlowStrums = PossibleStrengthWithAccordCombinations

// type AllSAPExcept<
//   S extends Strength,
//   A extends AllAccordUnion,
//   P extends AllPatternUnion,
// > = Exclude<PossibleLoops, SAP<S, A, P>>

// type WideSAP = SAP<Strength, AllAccordUnion, AllPatternUnion>

// type GetStrengthNeighbors<
//   S extends Strength,
//   A extends AllAccordUnion,
//   P extends AllPatternUnion,
// > =
//   Exclude<Strength, S> extends infer _S
//     ? _S extends Strength
//       ? SAP<_S, A, P>
//       : never
//     : never

// type GetAccordNeighbors<
//   S extends Strength,
//   A extends AllAccordUnion,
//   P extends AllPatternUnion,
// > =
//   Exclude<AllAccordUnion, A> extends infer _A
//     ? _A extends AllAccordUnion
//       ? SAP<S, _A, P>
//       : never
//     : never

// type GetPatternNeighbors<
//   S extends Strength,
//   A extends AllAccordUnion,
//   P extends AllPatternUnion,
// > =
//   Exclude<AllPatternUnion, P> extends infer _P
//     ? _P extends AllPatternUnion
//       ? SAP<S, A, _P>
//       : never
//     : never

// type GetSAPNeighbors<
//   S extends Strength,
//   A extends AllAccordUnion,
//   P extends AllPatternUnion,
// > =
//   | GetStrengthNeighbors<S, A, P>
//   | GetAccordNeighbors<S, A, P>
//   | GetPatternNeighbors<S, A, P>

// type LoopTransitions = PossibleLoops extends infer FromLoop
//   ? FromLoop extends SAP<infer S, infer A, infer P>
//     ? GetSAPNeighbors<S, A, P> extends infer SAPNeighbor
//       ? SAPNeighbor extends any
//         ? {
//             readonly loopQueue: [FromLoop, SAPNeighbor]
//           }
//         : never
//       : never
//     : never
//   : never

// type TripleLoopTransitions = LoopTransitions extends {
//   readonly loopQueue: [infer FromLoop, infer MiddleLoop]
// }
//   ? MiddleLoop extends SAP<infer S, infer A, infer P>
//     ? GetSAPNeighbors<S, A, P> extends infer SAPNeighbor
//       ? SAPNeighbor extends any
//         ? FromLoop extends any
//           ? {
//               readonly loopQueue: [FromLoop, MiddleLoop, SAPNeighbor]
//             }
//           : never
//         : never
//       : never
//     : never
//   : never
