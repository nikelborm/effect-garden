import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Record from 'effect/Record'
import * as Schedule from 'effect/Schedule'
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
      const audioContextImplHack =
        audioContext as EAudioContext.EAudioContextInstance & {
          _audioContext: AudioContext
        }
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const currentlySelectedAssetState = yield* CurrentlySelectedAssetState

      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>({
        _tag: 'NotPlaying',
      })
      const fadeTime = 0.1 // seconds

      const current = SubscriptionRef.get(stateRef)
      const arrayOfCleanupFibers = []
      // TODO: fill
      // TODO: add internal cleanup stage, so that if a user click during cleanup, it's properly handled?

      const createSilentByDefaultPlayback = () => {}
      // SubscriptionRef.updateEffect

      const playCurrentlySelected = Effect.gen(function* () {
        const currentStatus = yield* current
        if (currentStatus._tag !== 'NotPlaying')
          return yield* Effect.die(
            'Play command can only be called on not-initialized player',
          )

        const { status } = yield* currentlySelectedAssetState.completionStatus

        if (status !== 'finished')
          return yield* Effect.die(
            'Play command should only be called when the current asset finished loading',
          )

        const asset = yield* currentlySelectedAssetState.current

        const assetFileHandle = yield* getFileHandle({
          dirHandle: rootDirectoryHandle,
          fileName: getLocalAssetFileName(
            new TaggedPatternPointer({
              accordIndex: asset.accord.index,
              patternIndex: asset.pattern.index,
              strength: asset.strength,
            }),
          ),
        })

        const fileArrayBuffer = yield* readFileBuffer(assetFileHandle)

        const data = yield* EAudioContext.decodeAudioData(
          audioContext,
          fileArrayBuffer,
        )

        const dataImplHack = data as EAudioBuffer.EAudioBuffer & {
          _audioBuffer: AudioBuffer
        }
        const time = yield* EAudioContext.currentTime(audioContext)

        yield* SubscriptionRef.set(stateRef, {
          _tag: 'PlayingAsset' as const,
          current: yield* createImmediatelyLoudPlayback(
            audioContextImplHack._audioContext,
            dataImplHack._audioBuffer,
            time,
          ),
          currentAsset: asset,
          playbackStartedAtSecond: time,
        })

        yield* Effect.log('started playing')
      }).pipe(
        Effect.asVoid,
        Effect.tapErrorCause(e => Effect.logError(e)),
      )

      const changeAsset = Effect.fn(function* (asset: CurrentSelectedAsset) {
        const currentStatus = yield* current
        switch (currentStatus._tag) {
          case 'NotPlaying':
            return yield* Effect.die(
              'Change asset command can only be called on initialized player',
            )
          case 'PlayingAsset': {
            // const nextPlayback = createPlayback(buffer)
            // const oldPlayback = currentStatus.current
            // oldPlayback.gainNode.gain.exponentialRampToValueAtTime(
            //   0.001,
            //   audioContext.currentTime + fadeTime,
            // )
            // nextPlayback.gainNode.gain.setValueAtTime(
            //   0.001,
            //   audioContext.currentTime,
            // )
            // nextPlayback.gainNode.gain.exponentialRampToValueAtTime(
            //   1,
            //   audioContext.currentTime + fadeTime,
            // )
            // nextPlayback.bufferSource.start()
            // const cleanupFiber = yield* Effect.sleep(
            //   Duration.seconds(fadeTime + 0.1),
            // ).pipe(
            //   Effect.tap(() => cleanupPlayback(oldPlayback)),
            //   Effect.zipRight(
            //     SubscriptionRef.update(state, s =>
            //       s._tag === 'ScheduledChange'
            //         ? {
            //             _tag: 'PlayingAsset' as const,
            //             current: nextPlayback,
            //           }
            //         : s,
            //     ),
            //   ),
            //   Effect.fork,
            // )
            // yield* SubscriptionRef.set(state, {
            //   _tag: 'ScheduledChange' as const,
            //   current: oldPlayback,
            //   next: nextPlayback,
            //   cleanupFiber,
            // })

            break
          }
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

      const stop = () =>
        EFunction.pipe(
          Effect.all({
            time: EAudioContext.currentTime(audioContext),
            preState: SubscriptionRef.getAndSet(stateRef, {
              _tag: 'NotPlaying',
            }),
          }),
          Effect.flatMap(({ time, preState }) => {
            if (preState._tag === 'NotPlaying') return Effect.void

            const nodes =
              preState._tag === 'PlayingAsset'
                ? [preState.current]
                : [preState.current, preState.next]
            return Effect.forEach(
              nodes,
              p => {
                p.gainNode.gain.exponentialRampToValueAtTime(
                  0.001,
                  time + fadeTime,
                )
                return cleanupPlayback(p).pipe(
                  Effect.delay(Duration.seconds(fadeTime + 0.1)),
                )
              },
              { discard: true },
            )
          }),
        )

      const isPlaying = (current: AppPlaybackState) =>
        current._tag !== 'NotPlaying'

      const isCurrentlyPlayingEffect = Effect.map(current, isPlaying)
      const latestIsPlayingFlagStream = yield* stateRef.changes.pipe(
        Stream.map(isPlaying),
        Stream.changes,
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      const playStopButtonPressableFlagChangesStream = yield* EFunction.pipe(
        latestIsPlayingFlagStream,
        Stream.flatMap(
          isPlaying =>
            isPlaying
              ? Stream.succeed(true)
              : Stream.map(
                  currentlySelectedAssetState.completionStatusChangesStream,
                  ({ status }) => status === 'finished',
                ),
          { switch: true, concurrency: 1 },
        ),
        Stream.changes,
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      currentlySelectedAssetState.changes.pipe(Stream.map(e => e))

      return {
        playStopButtonPressableFlagChangesStream,
        playCurrentlySelected,
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

const getAbsoluteNextTick = (
  audioContext: AudioContext,
  secondsThatHavePassedFromAudioContextInitWhenPlaybackStarted: number,
) => {
  const secondsPassedSincePlaybackStart =
    audioContext.currentTime -
    secondsThatHavePassedFromAudioContextInitWhenPlaybackStarted
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

export type AppPlaybackState =
  | { readonly _tag: 'NotPlaying' }
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
