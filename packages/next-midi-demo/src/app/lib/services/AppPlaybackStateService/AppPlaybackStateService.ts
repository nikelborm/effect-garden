import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { AssetPointer } from '../../audioAssetHelpers.ts'
import { CurrentlySelectedAssetState } from '../CurrentlySelectedAssetState.ts'
import { cleanupAllPlaybacks } from './cleanupAllPlaybacks.ts'
import { makeCleanupFibersFactory } from './makeCleanupFibers.ts'
import { makeNewPlayingAssetState } from './makeNewPlayingAssetState.ts'
import { reschedulePlayback } from './reschedulePlayback/reschedulePlayback.ts'
import type { AppPlaybackState } from './types/index.ts'

export type {
  AppPlaybackState,
  AudioPlayback,
  LoopLoopLoopTransition,
  LoopLoopSilenceTransition,
  LoopLoopTransition,
  LoopSilenceTransition,
  LoopTransitionElementWithScheduledCleanup,
  LoopTransitionQueueElement,
  NotPlaying,
  PlayingAppPlaybackStates,
  PlayingLoop,
  PlayingSlowStrum,
  SlowStrumLoopTransition,
  SlowStrumTransitionQueueElement,
} from './types/index.ts'

const AudioContextLive = Layer.orDie(EAudioContext.layer())

export class AppPlaybackStateService extends Effect.Service<AppPlaybackStateService>()(
  'next-midi-demo/AppPlaybackStateService',
  {
    accessors: true,
    dependencies: [AudioContextLive],
    scoped: Effect.gen(function* () {
      const selectedAssetState = yield* CurrentlySelectedAssetState

      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>({
        _tag: 'NotPlaying',
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
      ).pipe(Effect.tapErrorCause(Effect.logError))

      yield* Effect.addFinalizer(() =>
        Effect.map(stateRef.get, state =>
          state._tag === 'NotPlaying'
            ? Effect.void
            : cleanupAllPlaybacks(state),
        ),
      )

      const makeCleanupFibers = makeCleanupFibersFactory(stateRef)

      const latestIsPlayingFlagStream = yield* stateRef.changes.pipe(
        Stream.map(current => current._tag !== 'NotPlaying'),
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

      const playbackPublicInfoChangesStream = Stream.map(
        stateRef.changes,
        state =>
          state._tag === 'NotPlaying'
            ? state
            : ({
                _tag: state._tag,
                currentAsset: state.transitionQueue[0].asset,
                assetTransitionsQueue: state.transitionQueue.map(
                  a => a.asset,
                ) as ReadonlyArray<AssetPointer>,
              } as const),
      )

      yield* selectedAssetState.changes.pipe(
        Stream.tap(asset =>
          SubscriptionRef.updateEffect(stateRef, state =>
            reschedulePlayback(state, asset, { makeCleanupFibers }),
          ),
        ),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      // yield* stateRef.changes.pipe(
      //   Stream.filter(state => state._tag === 'PlayingSlowStrum'),
      //   Stream.tap(
      //     Effect.fn(function* (state) {
      //       if (state._tag !== 'PlayingSlowStrum') return
      //       const [{ playback, durationSeconds }] = state.transitionQueue
      //       const secondsSinceAudioContextInit =
      //         yield* EAudioContext.currentTime(audioContext)
      //       const remainingSeconds =
      //         state.playbackStartedAtSecond +
      //         durationSeconds -
      //         secondsSinceAudioContextInit
      //       yield* SubscriptionRef.updateEffect(
      //         stateRef,
      //         Effect.fn(function* (currentState) {
      //           if (
      //             currentState._tag !== 'PlayingSlowStrum' ||
      //             currentState.transitionQueue[0].playback !== playback
      //           )
      //             return currentState
      //           yield* cleanupAllPlaybacks(currentState)
      //           return { _tag: 'NotPlaying' as const }
      //         }),
      //       ).pipe(
      //         stateSemaphore.withPermits(1),
      //         Effect.delay(Duration.seconds(Math.max(0, remainingSeconds))),
      //         Effect.tapErrorCause(Effect.logError),
      //         Effect.forkDaemon,
      //       )
      //     }),
      //   ),
      //   Stream.runDrain,
      //   Effect.tapErrorCause(Effect.logError),
      //   Effect.forkScoped,
      // )

      return {
        playStopButtonPressableFlagChangesStream,
        switchPlayPauseFromCurrentlySelected,
        latestIsPlayingFlagStream,
        playbackPublicInfoChangesStream,
      }
    }),
  },
) {}
