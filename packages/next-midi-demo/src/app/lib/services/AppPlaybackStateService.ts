import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import type * as Fiber from 'effect/Fiber'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'
import * as SubscriptionRef from 'effect/SubscriptionRef'

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
      const audioContextImplHack = audioContext as EAudioContext.Instance & {
        _audioContext: AudioContext
      }
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const selectedAssetState = yield* CurrentlySelectedAssetState
      const stateSemaphore = yield* Effect.makeSemaphore(1)

      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>({
        _tag: 'NotPlaying',
      })
      const fadeTime = 0.1 // seconds

      const arrayOfCleanupFibers = []
      // TODO: fill
      // TODO: add internal cleanup stage, so that if a user click during cleanup, it's properly handled?

      const createSilentByDefaultPlayback = () => {}

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
        if (!(yield* selectedAssetState.isFinishedCompletely))
          return yield* Effect.die(
            'Play command should only be called when the current asset finished loading',
          )

        const currentAsset = yield* selectedAssetState.current

        const audioBuffer = yield* getAudioBufferOfAsset(currentAsset)

        const audioBufferImplHack = audioBuffer as EAudioBuffer.EAudioBuffer & {
          _audioBuffer: AudioBuffer
        }

        const time = yield* EAudioContext.currentTime(audioContext)

        const currentPlayback = yield* createPlayback(
          audioContextImplHack._audioContext,
          audioBufferImplHack._audioBuffer,
        )
        currentPlayback.gainNode.gain.setValueAtTime(1, time)
        currentPlayback.bufferSource.start()

        yield* Effect.log('started playing')

        return {
          _tag: 'PlayingAsset' as const,
          currentPlayback,
          currentAsset,
          playbackStartedAtSecond: time,
        }
      })

      const cleanupPlaybacks = Effect.fn(function* (
        state: PlayingAppPlaybackStates,
      ) {
        const playbacksToCleanup =
          state._tag === 'PlayingAsset'
            ? [state.currentPlayback]
            : [state.currentPlayback, state.nextPlayback]

        const time = yield* EAudioContext.currentTime(audioContext)

        yield* Effect.forEach(
          playbacksToCleanup,
          p => {
            p.gainNode.gain.exponentialRampToValueAtTime(0.001, time + fadeTime)
            return cleanupPlayback(p).pipe(
              Effect.delay(Duration.seconds(fadeTime + 0.1)),
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

          yield* cleanupPlaybacks(state)

          return { _tag: 'NotPlaying' }
        }),
      ).pipe(Effect.tapErrorCause(Effect.logError))

      const changeAsset = (asset: CurrentSelectedAsset) =>
        SubscriptionRef.updateEffect(
          stateRef,
          Effect.fn(function* (oldState) {
            if (oldState._tag === 'NotPlaying') return oldState

            const audioBuffer = yield* getAudioBufferOfAsset(asset)

            const audioBufferImplHack =
              audioBuffer as EAudioBuffer.EAudioBuffer & {
                _audioBuffer: AudioBuffer
              }

            const secondsSinceAudioContextInit =
              yield* EAudioContext.currentTime(audioContext)

            const secondsPassedSincePlaybackStart =
              secondsSinceAudioContextInit - oldState.playbackStartedAtSecond

            const nextTickIndexSincePlaybackStart = Math.ceil(
              secondsPassedSincePlaybackStart / tickSizeInSeconds,
            )

            const nextTickStartsAtSecondsSincePlaybackStart =
              nextTickIndexSincePlaybackStart * tickSizeInSeconds

            const nextTickStartsAtSecondsSinceContextInit =
              oldState.playbackStartedAtSecond +
              nextTickStartsAtSecondsSincePlaybackStart

            const previousPlaybackFadingEndsAt =
              nextTickStartsAtSecondsSinceContextInit

            const previousPlaybackFadingStartsAt =
              previousPlaybackFadingEndsAt - fadeTime

            const secondsSinceLatestTrackLoopStart =
              secondsPassedSincePlaybackStart % trackSizeInSeconds

            const nextTickIndexSinceLatestTrackLoopStart = Math.ceil(
              secondsSinceLatestTrackLoopStart / tickSizeInSeconds,
            )

            const secondsSinceNowBeforeFadingEnds =
              previousPlaybackFadingEndsAt - secondsSinceAudioContextInit

            const nextPlayback = yield* createPlayback(
              audioContextImplHack._audioContext,
              audioBufferImplHack._audioBuffer,
            )
            nextPlayback.gainNode.gain.exponentialRampToValueAtTime(
              1,
              nextTickStartsAtSecondsSinceContextInit,
            )
            nextPlayback.bufferSource.start(
              nextTickStartsAtSecondsSinceContextInit,
              nextTickIndexSinceLatestTrackLoopStart * tickSizeInSeconds,
            )
            oldState.currentPlayback.gainNode.gain.cancelScheduledValues(0)
            oldState.currentPlayback.gainNode.gain.setValueAtTime(
              1,
              previousPlaybackFadingStartsAt,
            )
            oldState.currentPlayback.gainNode.gain.exponentialRampToValueAtTime(
              0.001,
              previousPlaybackFadingEndsAt,
            )

            if (oldState._tag === 'PlayingAsset') {
              const cleanupFiber = yield* EFunction.pipe(
                SubscriptionRef.updateEffect(
                  stateRef,
                  Effect.fn('executeScheduledCleanupOfState')(
                    function* (stateRightBeforeCleanup) {
                      yield* Effect.log('Playback cleanup')
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
                // stateSemaphore.withPermits(1),
                Effect.delay(Duration.seconds(secondsSinceNowBeforeFadingEnds)),
                Effect.tapErrorCause(Effect.logError),
                Effect.forkDaemon,
              )

              return {
                _tag: 'ScheduledChange' as const,
                currentPlayback: oldState.currentPlayback,
                nextPlayback,
                currentAsset: oldState.currentAsset,
                playbackStartedAtSecond: oldState.playbackStartedAtSecond,
                cleanupFiber,
              } satisfies PlayingAppPlaybackStates
            }
            if (oldState._tag === 'ScheduledChange') {
              oldState.nextPlayback.bufferSource.stop()
              oldState.nextPlayback.gainNode.gain.cancelScheduledValues(0)

              yield* cleanupPlayback(oldState.nextPlayback)

              return {
                _tag: 'ScheduledChange' as const,
                currentPlayback: oldState.currentPlayback,
                nextPlayback,
                currentAsset: oldState.currentAsset,
                playbackStartedAtSecond: oldState.playbackStartedAtSecond,
                cleanupFiber: oldState.cleanupFiber,
              } satisfies PlayingAppPlaybackStates
            }
            return oldState
          }),
        ) //.pipe(stateSemaphore.withPermits(1))

      const isPlaying = (current: AppPlaybackState) =>
        current._tag !== 'NotPlaying'

      const isCurrentlyPlayingEffect = Effect.map(stateRef.get, isPlaying)
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
              : selectedAssetState.isFinishedCompletelyChangesStream,
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
        stop,
        isCurrentlyPlayingEffect,
        latestIsPlayingFlagStream,
        playbackPublicInfoChangesStream: Stream.map(stateRef.changes, e =>
          e._tag === 'NotPlaying' ? e : Struct.pick(e, '_tag', 'currentAsset'),
        ),
      }
    }),
  },
) {}

const createPlayback = (audioContext: AudioContext, buffer: AudioBuffer) =>
  Effect.sync(() => {
    const bufferSource = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()
    bufferSource.loop = true
    bufferSource.buffer = buffer
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
