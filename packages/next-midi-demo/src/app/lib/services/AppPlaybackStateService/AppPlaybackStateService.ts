import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  getLocalAssetFileName,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../audioAssetHelpers.ts'
import { getFileHandle, readFileBuffer } from '../../opfs.ts'
import {
  CurrentlySelectedAssetState,
  type CurrentSelectedAsset,
} from '../CurrentlySelectedAssetState.ts'
import { RootDirectoryHandle } from '../RootDirectoryHandle.ts'
import { getNewCleanedUpState } from './cleanupState.ts'
import {
  asEarlyAsPossibleInSeconds,
  maxLoudness,
  minLoudness,
  transitionTimeInSeconds,
} from './constants.ts'
import {
  createLoopingPlayback,
  createOneshotPlayback,
  getAudioBufferDurationSeconds,
  helpGarbageCollectionOfPlayback,
} from './playbackNodes/index.ts'
import { reschedulePlayback } from './reschedulePlayback/reschedulePlayback.ts'
import type {
  AppPlaybackState,
  CleanupFiberToolkit,
  PlayingAppPlaybackStates,
  PlayingLoop,
  PlayingSlowStrum,
} from './types/index.ts'

export type {
  AppPlaybackState,
  AudioPlayback,
  InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence,
  InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop,
  LoopTransitionElementWithScheduledCleanup,
  LoopTransitionQueueElement,
  NotPlaying,
  PlayingAppPlaybackStates,
  PlayingLoop,
  PlayingSlowStrum,
  ScheduledLoopToAnotherLoopTransition,
  ScheduledLoopToSilenceTransition,
  ScheduledSlowStrumToLoopTransition,
  SlowStrumTransitionQueueElement,
} from './types/index.ts'

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

        if (Option.isNone(currentAsset.pattern)) {
          const currentPlayback = yield* createOneshotPlayback(
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

          yield* Effect.log('started playing slow strum')

          const durationSeconds = getAudioBufferDurationSeconds(audioBuffer)

          return {
            _tag: 'PlayingSlowStrum' as const,
            transitionQueue: [
              {
                playback: currentPlayback,
                asset: currentAsset,
                durationSeconds,
              },
            ],
            playbackStartedAtSecond: secondsSinceAudioContextInit,
          } satisfies PlayingSlowStrum
        }

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

      const reschedulePlaybackDeps = {
        audioContext,
        makeCleanupFibers,
        getAudioBufferOfAsset,
      }

      yield* selectedAssetState.changes.pipe(
        Stream.tap(asset =>
          stateRef.pipe(
            SubscriptionRef.updateEffect(state =>
              reschedulePlayback(state, asset, reschedulePlaybackDeps),
            ),
            stateSemaphore.withPermits(1),
          ),
        ),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      yield* stateRef.changes.pipe(
        Stream.filter(state => state._tag === 'PlayingSlowStrum'),
        Stream.tap(
          Effect.fn(function* (state) {
            if (state._tag !== 'PlayingSlowStrum') return
            const [{ playback, durationSeconds }] = state.transitionQueue
            const secondsSinceAudioContextInit =
              yield* EAudioContext.currentTime(audioContext)
            const remainingSeconds =
              state.playbackStartedAtSecond +
              durationSeconds -
              secondsSinceAudioContextInit
            yield* SubscriptionRef.updateEffect(
              stateRef,
              Effect.fn(function* (currentState) {
                if (
                  currentState._tag !== 'PlayingSlowStrum' ||
                  currentState.transitionQueue[0].playback !== playback
                )
                  return currentState
                yield* cleanupAllPlaybacks(currentState)
                return { _tag: 'NotPlaying' as const }
              }),
            ).pipe(
              stateSemaphore.withPermits(1),
              Effect.delay(Duration.seconds(Math.max(0, remainingSeconds))),
              Effect.tapErrorCause(Effect.logError),
              Effect.forkDaemon,
            )
          }),
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
                assetTransitionsQueue: state.transitionQueue.map(
                  a => a.asset,
                ) as ReadonlyArray<CurrentSelectedAsset>,
              } as const),
        ),
      }
    }),
  },
) {}
