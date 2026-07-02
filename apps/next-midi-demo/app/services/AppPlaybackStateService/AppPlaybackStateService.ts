import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { defaultAccord } from '../../domain/Accord.ts'
import { defaultStrength } from '../../domain/Strength.ts'
import {
  AccordInputBus,
  PatternInputBus,
  StrengthInputBus,
} from '../InputStreamBus.ts'
import { advancePlayback } from './advancePlayback/index.ts'
import { CleanupFiberMaker } from './CleanupFiberMaker.ts'
import { makeCleanupFibersFactory } from './makeCleanupFibers.ts'
// import { makeNewPlayingAssetState } from './makeNewPlayingAssetState.ts'
import type { AppPlaybackState } from './types/index.ts'
import { SilenceBoundPlayback } from './types/SilenceBoundPlayback.ts'

export class AppPlaybackStateService extends Effect.Service<AppPlaybackStateService>()(
  'next-midi-demo/AppPlaybackStateService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>(
        SilenceBoundPlayback.make({
          accord: defaultAccord,
          strength: defaultStrength,
          transitionQueue: [],
        }),
      )

      // const switchPlayPauseFromCurrentlySelected = SubscriptionRef.updateEffect(
      //   stateRef,
      //   Effect.fn(function* (state) {
      //     yield* Effect.log('Switch play pause from currently selected')
      //     const isStopped = state._tag === 'Silence'
      //     if (isStopped) return yield* makeNewPlayingAssetState

      //     yield* cleanupAllPlaybacks(state)

      //     return Silence.make()
      //   }),
      // ).pipe(Effect.tapErrorCause(Effect.logError))

      // yield* Effect.addFinalizer(() =>
      //   Effect.map(stateRef, state =>
      //     state._tag === 'Silence' ? Effect.void : cleanupAllPlaybacks(state),
      //   ),
      // )

      const makeCleanupFibers = makeCleanupFibersFactory(stateRef)

      const latestIsPlayingFlagStream = yield* stateRef.changes.pipe(
        // Sound is audible unless we are in pure silence (an empty
        // SilenceBoundPlayback queue); a fading-out loop still counts as playing.
        Stream.map(
          current =>
            current._tag !== 'SilenceBoundPlayback' ||
            current.transitionQueue.length > 0,
        ),
        Stream.changes,
        Stream.rechunk(1),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      // STUB: download-gating lived in CurrentlySelectedAssetState, now deleted.
      // Assume assets are downloaded, so the play/stop button is always
      // pressable. Real inference-from-playback comes later.
      const playStopButtonPressableFlagChangesStream = yield* Stream.succeed(
        true,
      ).pipe(Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }))

      // const _playbackPublicInfoChangesStream = Stream.map(
      //   stateRef.changes,
      //   state =>
      //     state._tag === 'Silence'
      //       ? state
      //       : ({
      //           _tag: state._tag,
      //           currentAsset: state.transitionQueue[0].asset,
      //           assetTransitionsQueue: state.transitionQueue.map(
      //             a => a.asset,
      //           ) as ReadonlyArray<AssetPointer>,
      //         } as const),
      // )
      yield* AccordInputBus.pressesOnlyStream.pipe(
        Stream.unwrap,
        Stream.merge(Stream.unwrap(PatternInputBus.pressesOnlyStream)),
        Stream.merge(Stream.unwrap(StrengthInputBus.pressesOnlyStream)),
        Stream.runForEach(signal =>
          SubscriptionRef.updateEffect(stateRef, state =>
            advancePlayback(state, signal.id).pipe(
              Effect.provideService(CleanupFiberMaker, makeCleanupFibers),
              Effect.tapErrorCause(Effect.logError),
            ),
          ),
        ),

        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )
      // Stream.mergeAll([,], { concurrency: 'unbounded' })

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
      //           return { _tag: 'Silence' as const }
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
        // switchPlayPauseFromCurrentlySelected,
        latestIsPlayingFlagStream,
        // тупо потому что не хочу усложнять себе работу
        playbackPublicInfoChangesStream: stateRef.changes,
      }
    }).pipe(Effect.withSpan('AppPlaybackStateService.init'), Effect.orDie),
  },
) {}
