import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as EArray from 'effect/Array'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import type * as Fiber from 'effect/Fiber'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'
import * as SubscriptionRef from 'effect/SubscriptionRef'
import * as ETuple from 'effect/Tuple'

import {
  getLocalAssetFileName,
  TaggedPatternPointer,
} from '../audioAssetHelpers.ts'
import { getFileHandle, readFileBuffer } from '../opfs.ts'
import {
  CurrentlySelectedAssetState,
  type CurrentSelectedAsset,
} from './CurrentlySelectedAssetState.ts'
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
      const transitionTimeInSeconds = 0.001
      const maxLoudness = 1
      const minLoudness = 0.001
      const asEarlyAsPossibleInSeconds = 0

      const getAudioBufferOfAsset = Effect.fn('getAudioBufferOfAsset')(
        function* ({ accord, pattern, strength }: CurrentSelectedAsset) {
          const assetFileHandle = yield* getFileHandle({
            dirHandle: rootDirectoryHandle,
            fileName: getLocalAssetFileName(
              new TaggedPatternPointer({
                accordIndex: accord.index,
                patternIndex: pattern.index,
                strength,
              }),
            ),
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
        currentPlayback.gainNode.gain.setValueAtTime(
          maxLoudness,
          asEarlyAsPossibleInSeconds,
        )
        currentPlayback.bufferSource.start(secondsSinceAudioContextInit)

        yield* Effect.log('started playing')

        return {
          _tag: 'PlayingAsset' as const,
          currentPlayback,
          currentAsset,
          playbackStartedAtSecond: secondsSinceAudioContextInit,
        }
      })

      const cleanupAllPlaybacks = Effect.fn(function* (
        state: PlayingAppPlaybackStates,
      ) {
        const playbacksToCleanup =
          state._tag === 'PlayingAsset'
            ? [state.currentPlayback]
            : [state.currentPlayback, state.nextPlayback]

        const secondsSinceAudioContextInit =
          yield* EAudioContext.currentTime(audioContext)

        yield* Effect.forEach(
          playbacksToCleanup,
          p => {
            p.gainNode.gain.exponentialRampToValueAtTime(
              minLoudness,
              secondsSinceAudioContextInit + transitionTimeInSeconds,
            )

            return cleanupPlayback(p).pipe(
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

          return { _tag: 'NotPlaying' }
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

      const changeAsset = (asset: CurrentSelectedAsset) =>
        SubscriptionRef.updateEffect(
          stateRef,
          Effect.fn('reschedulePlayback')(function* (oldState) {
            if (oldState._tag === 'NotPlaying') return oldState

            const audioBuffer = yield* getAudioBufferOfAsset(asset)

            const secondsSinceAudioContextInit =
              yield* EAudioContext.currentTime(audioContext)

            const secondsPassedSincePlaybackStart =
              secondsSinceAudioContextInit - oldState.playbackStartedAtSecond

            const nextTickIndexSincePlaybackStart = Math.ceil(
              secondsPassedSincePlaybackStart / tickSizeInSeconds,
            )

            const nextTickStartsAtSecondsSincePlaybackStart =
              nextTickIndexSincePlaybackStart * tickSizeInSeconds

            const nextTickStartsAtSecondsSinceAudioContextInit =
              oldState.playbackStartedAtSecond +
              nextTickStartsAtSecondsSincePlaybackStart

            const previousPlaybackFadingStartsAt =
              nextTickStartsAtSecondsSinceAudioContextInit -
              transitionTimeInSeconds

            const previousPlaybackFadingEndsAt =
              nextTickStartsAtSecondsSinceAudioContextInit

            const secondsSinceLatestTrackLoopStart =
              secondsPassedSincePlaybackStart % trackSizeInSeconds

            const secondsSinceNowBeforeFadingEnds =
              previousPlaybackFadingEndsAt - secondsSinceAudioContextInit

            const newlyCreatedNextPlayback = yield* createLoopingPlayback(
              audioContext,
              audioBuffer,
            )

            newlyCreatedNextPlayback.gainNode.gain.setValueAtTime(
              minLoudness,
              asEarlyAsPossibleInSeconds,
            )
            newlyCreatedNextPlayback.gainNode.gain.setValueAtTime(
              minLoudness,
              previousPlaybackFadingStartsAt,
            )
            newlyCreatedNextPlayback.gainNode.gain.exponentialRampToValueAtTime(
              maxLoudness,
              previousPlaybackFadingEndsAt,
            )
            newlyCreatedNextPlayback.bufferSource.start(
              secondsSinceAudioContextInit,
              secondsSinceLatestTrackLoopStart,
            )

            oldState.currentPlayback.gainNode.gain.cancelScheduledValues(
              secondsSinceAudioContextInit,
            )
            oldState.currentPlayback.gainNode.gain.setValueAtTime(
              maxLoudness,
              secondsSinceAudioContextInit,
            )
            oldState.currentPlayback.gainNode.gain.setValueAtTime(
              maxLoudness,
              previousPlaybackFadingStartsAt,
            )
            oldState.currentPlayback.gainNode.gain.exponentialRampToValueAtTime(
              minLoudness,
              previousPlaybackFadingEndsAt,
            )

            const makeCleanupFiber = (delayForSeconds: number) =>
              EFunction.pipe(
                SubscriptionRef.updateEffect(
                  stateRef,
                  Effect.fn('executeScheduledCleanupOfState')(
                    function* (stateRightBeforeCleanup) {
                      yield* Effect.logTrace('Playback cleanup')
                      if (stateRightBeforeCleanup._tag !== 'ScheduledChange')
                        return stateRightBeforeCleanup

                      yield* cleanupPlayback(
                        stateRightBeforeCleanup.currentPlayback,
                      )
                      return {
                        _tag: 'PlayingAsset' as const,
                        currentPlayback: stateRightBeforeCleanup.nextPlayback,
                        playbackStartedAtSecond:
                          stateRightBeforeCleanup.playbackStartedAtSecond,
                        currentAsset: yield* selectedAssetState.current,
                      }
                    },
                  ),
                ),
                stateSemaphore.withPermits(1),
                Effect.delay(Duration.seconds(delayForSeconds)),
                Effect.tapErrorCause(Effect.logError),
                Effect.forkDaemon,
              )

            const cleanupFiber =
              oldState._tag === 'ScheduledChange'
                ? oldState.cleanupFiber
                : yield* makeCleanupFiber(secondsSinceNowBeforeFadingEnds)

            if (oldState._tag === 'ScheduledChange')
              yield* cleanupPlayback(oldState.nextPlayback)

            return {
              _tag: 'ScheduledChange' as const,
              currentPlayback: oldState.currentPlayback,
              nextPlayback: newlyCreatedNextPlayback,
              currentAsset: oldState.currentAsset,
              playbackStartedAtSecond: oldState.playbackStartedAtSecond,
              cleanupFiber,
            } satisfies PlayingAppPlaybackStates
          }),
        ).pipe(stateSemaphore.withPermits(1))

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
        Stream.tap(changeAsset),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      return {
        playStopButtonPressableFlagChangesStream,
        switchPlayPauseFromCurrentlySelected,
        latestIsPlayingFlagStream,
        playbackPublicInfoChangesStream: Stream.map(stateRef.changes, e =>
          e._tag === 'NotPlaying' ? e : Struct.pick(e, '_tag', 'currentAsset'),
        ),
      }
    }),
  },
) {}

const createLoopingPlayback = (
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
    bufferSource.loop = true
    bufferSource.buffer = audioBufferImplHack._audioBuffer
    bufferSource.connect(gainNode)

    gainNode.connect(audioContext.destination)

    return { bufferSource, gainNode }
  })

const ticksPerTrack = 8
const tickSizeInSeconds = 1
const trackSizeInSeconds = ticksPerTrack * tickSizeInSeconds

const cleanupPlayback = ({ bufferSource, gainNode }: AudioPlayback) =>
  Effect.sync(() => {
    bufferSource.stop()
    bufferSource.disconnect()
    gainNode.gain.cancelScheduledValues(0)
    gainNode.disconnect()
  })

export type AudioPlayback = {
  readonly bufferSource: AudioBufferSourceNode
  readonly gainNode: GainNode
}

export type PlayingAppPlaybackStates =
  | {
      readonly _tag: 'PlayingAsset'
      readonly playbackStartedAtSecond: number
      readonly currentAsset: CurrentSelectedAsset

      readonly currentPlayback: AudioPlayback
    }
  | {
      readonly _tag: 'ScheduledChange'
      readonly playbackStartedAtSecond: number
      readonly currentAsset: CurrentSelectedAsset

      readonly currentPlayback: AudioPlayback
      readonly nextPlayback: AudioPlayback
      readonly cleanupFiber: Fiber.RuntimeFiber<void, never>
    }

export type AppPlaybackState =
  | { readonly _tag: 'NotPlaying' }
  | PlayingAppPlaybackStates

const excludePartition = <
  const sets extends Set<any>,
  T extends sets extends Set<infer V> ? V : never,
>(
  element: T,
  set: sets,
) => {
  return set.difference(new Set([element])) as T extends any
    ? Set<Exclude<values, T>>
    : never
  // {
  //   beginning: ETuple.at(arr, 0),
  //   rest: arr.slice(1) as arr extends [infer _, ...infer Rest] ? Rest : never,
  // }
}

function asd() {
  for (const i1 of [1, 2, 3] as const) {
    const rest = excludePartition(i1, new Set([1, 2, 3] as const))
  }
}
