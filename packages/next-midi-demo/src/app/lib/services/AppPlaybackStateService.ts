import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
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

      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>({
        _tag: 'NotPlaying',
      })
      const fadeTime = 0.1 // seconds

      const current = SubscriptionRef.get(stateRef)

      const changesStream = yield* stateRef.changes.pipe(
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )
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

        const playback = yield* createImmediatelyLoudPlayback(
          audioContextImplHack._audioContext,
          audioBufferImplHack._audioBuffer,
          time,
        )

        yield* Effect.log('started playing')

        return {
          _tag: 'PlayingAsset' as const,
          current: playback,
          currentAsset,
          playbackStartedAtSecond: time,
        }
      })

      const cleanupPlaybacks = Effect.fn(function* (
        state: PlayingAppPlaybackStates,
      ) {
        const playbacksToCleanup =
          state._tag === 'PlayingAsset'
            ? [state.current]
            : [state.current, state.next]

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
          Effect.fn(function* (oldPlayback) {
            if (oldPlayback._tag === 'PlayingAsset') {
              const audioBuffer = yield* getAudioBufferOfAsset(asset)

              const audioBufferImplHack =
                audioBuffer as EAudioBuffer.EAudioBuffer & {
                  _audioBuffer: AudioBuffer
                }

              const nextPlayback = yield* createPlayback(
                audioContextImplHack._audioContext,
                audioBufferImplHack._audioBuffer,
              )

              const secondsSinceAudioContextInit =
                yield* EAudioContext.currentTime(audioContext)

              const secondsPassedSincePlaybackStart =
                secondsSinceAudioContextInit -
                oldPlayback.playbackStartedAtSecond

              const nextTickIndexSincePlaybackStart = Math.ceil(
                secondsPassedSincePlaybackStart / tickSizeInSeconds,
              )

              const nextTickStartsAtSecondsSincePlaybackStart =
                nextTickIndexSincePlaybackStart * tickSizeInSeconds

              const nextTickStartsAtSecondsSinceContextInit =
                oldPlayback.playbackStartedAtSecond +
                nextTickStartsAtSecondsSincePlaybackStart

              const fadingEndsAt = nextTickStartsAtSecondsSinceContextInit

              const fadingStartsAt = fadingEndsAt - fadeTime

              oldPlayback.current.gainNode.gain.setValueAtTime(
                1,
                fadingStartsAt,
              )
              oldPlayback.current.gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                fadingEndsAt,
              )

              const secondsSinceLatestTrackLoopStart =
                secondsPassedSincePlaybackStart % trackSizeInSeconds

              const nextTickIndexSinceLatestTrackLoopStart = Math.ceil(
                secondsSinceLatestTrackLoopStart / tickSizeInSeconds,
              )

              // nextPlayback.gainNode.gain.setValueAtTime(
              //   0.001,
              //   nextTickStartsAtSecondsSinceContextInit - fadeTime,
              // )
              nextPlayback.gainNode.gain.exponentialRampToValueAtTime(
                1,
                nextTickStartsAtSecondsSinceContextInit,
              )
              nextPlayback.bufferSource.start(
                // nextTickStartsAtSecondsSinceContextInit - fadeTime,
                nextTickStartsAtSecondsSinceContextInit,
                nextTickIndexSinceLatestTrackLoopStart * tickSizeInSeconds,
              )
              const cleanupFiber = yield* EFunction.pipe(
                Effect.succeed(1),
                Effect.asVoid,
                // Effect.sleep(Duration.seconds(fadeTime + 0.1)),
                // Effect.andThen(cleanupPlayback(oldPlayback.current)),
                // Effect.zipRight(
                //   SubscriptionRef.update(stateRef, s =>
                //     s._tag === 'ScheduledChange'
                //       ? {
                //           _tag: 'PlayingAsset' as const,
                //           current: nextPlayback,
                //           playbackStartedAtSecond: s.playbackStartedAtSecond,
                //           // ????? currentAsset
                //           currentAsset: s.currentAsset,
                //         }
                //       : s,
                //   ),
                // ),
                Effect.tapErrorCause(Effect.logError),
                Effect.fork,
              )

              return {
                _tag: 'ScheduledChange' as const,
                current: oldPlayback.current,
                next: nextPlayback,
                currentAsset: oldPlayback.currentAsset,
                playbackStartedAtSecond: oldPlayback.playbackStartedAtSecond,
                cleanupFiber,
              } satisfies PlayingAppPlaybackStates
            }
            return oldPlayback
          }),
        )

      const changeAsset_old = Effect.fn(function* (
        asset: CurrentSelectedAsset,
      ) {
        const currentStatus = yield* current
        switch (currentStatus._tag) {
          case 'NotPlaying':
            return yield* Effect.die(
              'Change asset command can only be called on initialized player',
            )
          case 'ScheduledChange': {
            yield* Fiber.interrupt(currentStatus.cleanupFiber)
            yield* cleanupPlayback(currentStatus.next)
            // const newNextPlayback = createPlayback(buffer)
            // const current = currentStatus.current
            // current.gainNode.gain.cancelScheduledValues(audioContext.currentTime)
            // current.gainNode.gain.exponentialRampToValueAtTime(
            //   0.001,
            //   audioContext.currentTime + fadeTime,
            // )
            // newNextPlayback.gainNode.gain.setValueAtTime(
            //   0.001,
            //   audioContext.currentTime,
            // )
            // newNextPlayback.gainNode.gain.exponentialRampToValueAtTime(
            //   1,
            //   audioContext.currentTime + fadeTime,
            // )
            // newNextPlayback.bufferSource.start()
            // const newFiber = yield* cleanupPlayback(current).pipe(
            //   Effect.delay(Duration.seconds(fadeTime + 0.1)),
            //   Effect.zipRight(
            //     SubscriptionRef.update(state, () => ({
            //       _tag: 'PlayingAsset' as const,
            //       current: newNextPlayback,
            //     })),
            //   ),
            //   Effect.fork,
            // )
            // yield* SubscriptionRef.set(state, {
            //   _tag: 'ScheduledChange',
            //   current: current,
            //   next: newNextPlayback,
            //   cleanupFiber: newFiber,
            // })
            break
          }
        }
      })

      const isPlaying = (current: AppPlaybackState) =>
        current._tag !== 'NotPlaying'

      const isCurrentlyPlayingEffect = Effect.map(current, isPlaying)
      const latestIsPlayingFlagStream = changesStream.pipe(
        Stream.map(isPlaying),
        Stream.changes,

        // Stream.rechunk(1),
        // Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
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
        // Stream.rechunk(1),
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
        playbackPublicInfoChangesStream: Stream.map(changesStream, e =>
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

const createImmediatelyLoudPlayback = (
  audioContext: AudioContext,
  buffer: AudioBuffer,
  time: number,
) =>
  Effect.map(createPlayback(audioContext, buffer), pb => {
    pb.gainNode.gain.setValueAtTime(1, time)
    pb.bufferSource.start()
    return pb
  })

const ticksPerTrack = 8
const tickSizeInSeconds = 1
const trackSizeInSeconds = ticksPerTrack * tickSizeInSeconds

const getSecondsSinceAudioContextInitNextTickWillStartAt = (
  secondsSinceAudioContextInit: number,
  secondsBetweenAudioContextInitAndPlaybackStart: number,
) => {
  const secondsPassedSincePlaybackStart =
    secondsSinceAudioContextInit -
    secondsBetweenAudioContextInitAndPlaybackStart

  const nextTickIndex = Math.ceil(
    secondsPassedSincePlaybackStart / tickSizeInSeconds,
  )

  return nextTickIndex * tickSizeInSeconds
}

const silencePlaybackAtNextTick = () => []

const createInitiallySilentPlaybackWithScheduledLoudnessIncrease = (
  audioContext: AudioContext,
  buffer: AudioBuffer,
  playbackStartedAtSecond: number,
) =>
  Effect.map(createPlayback(audioContext, buffer), pb => {
    pb.gainNode.gain.setValueAtTime(1, playbackStartedAtSecond)
    pb.bufferSource.start()
    return pb
  })

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

      readonly current: AudioPlayback
    }
  | {
      readonly _tag: 'ScheduledChange'
      readonly playbackStartedAtSecond: number
      readonly currentAsset: CurrentSelectedAsset

      readonly current: AudioPlayback
      readonly next: AudioPlayback
      readonly cleanupFiber: Fiber.RuntimeFiber<void, never>
    }

export type AppPlaybackState =
  | { readonly _tag: 'NotPlaying' }
  | PlayingAppPlaybackStates
