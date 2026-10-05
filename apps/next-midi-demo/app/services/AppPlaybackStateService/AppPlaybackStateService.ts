/** biome-ignore-all lint/correctness/useHookAtTopLevel: these are not hooks> */
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  AccordInputBus,
  PatternInputBus,
  StrengthInputBus,
} from '../InputStreamBus.ts'
import { advancePlayback } from './advancePlayback/index.ts'
import { CleanupFiberMaker } from './CleanupFiberMaker.ts'
// import { makeNewAssetState } from './makeNewAssetState.ts'
import type { AppPlaybackState } from './types/index.ts'
import { SilenceState } from './types/SilenceBoundPlayback.ts'

export class AppPlaybackStateService extends Context.Service<AppPlaybackStateService>()(
  'next-midi-demo/AppPlaybackStateService',
  {
    make: Effect.gen(function* () {
      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>(
        SilenceState.default,
      )

      // const switchPlayPauseFromCurrentlySelected = SubscriptionRef.updateEffect(
      //   stateRef,
      //   Effect.fn(function* (state) {
      //     yield* Effect.log('Switch play pause from currently selected')
      //     const isStopped = state._tag === 'Silence'
      //     if (isStopped) return yield* makeNewAssetState

      //     yield* cleanupAllPlaybacks(state)

      //     return Silence.make()
      //   }),
      // ).pipe(Effect.tapCause(Effect.logError))

      // yield* Effect.addFinalizer(() =>
      //   Effect.map(stateRef, state =>
      //     state._tag === 'Silence' ? Effect.void : cleanupAllPlaybacks(state),
      //   ),
      // )

      const CleanupFiberMakerLayer = CleanupFiberMaker.layer(stateRef)

      const latestIsPlayingFlagStream = yield* SubscriptionRef.changes(
        stateRef,
      ).pipe(
        // Sound is audible unless we are in pure silence (an empty
        // SilenceBoundPlayback queue); a fading-out loop still counts as playing.
        Stream.map(
          current =>
            current._tag !== 'SilenceBoundStateBase' ||
            current.transitionQueue.length > 0,
        ),
        Stream.changes,
        Stream.broadcast({ capacity: 'unbounded', replay: 1 }),
      )

      // STUB: download-gating lived in CurrentlySelectedAssetState, now deleted.
      // Assume assets are downloaded, so the play/stop button is always
      // pressable. Real inference-from-playback comes later.
      const playStopButtonPressableFlagChangesStream = yield* Stream.succeed(
        true,
      ).pipe(Stream.broadcast({ capacity: 'unbounded', replay: 1 }))

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
      yield* AccordInputBus.pressedDownParamButtonIdDataStream.pipe(
        Stream.merge(PatternInputBus.pressedDownParamButtonIdDataStream),
        Stream.merge(StrengthInputBus.pressedDownParamButtonIdDataStream),
        Stream.runForEach(({ id: pressedDownParamButtonId }) =>
          SubscriptionRef.updateEffect(stateRef, state =>
            advancePlayback(state, pressedDownParamButtonId).pipe(
              Effect.provide(CleanupFiberMakerLayer),
              Effect.tapCause(Effect.logError),
            ),
          ),
        ),

        Effect.tapCause(Effect.logError),
        Effect.forkScoped,
        e => e,
      )
      // Stream.mergeAll([,], { concurrency: 'unbounded' })

      // yield* stateRef.changes.pipe(
      //   Stream.filter(state => state._tag === 'SlowStrum'),
      //   Stream.tap(
      //     Effect.fn(function* (state) {
      //       if (state._tag !== 'SlowStrum') return
      //       const [{ playback, durationSeconds }] = state.transitionQueue
      //       const secondsSinceAudioContextInit =
      //         yield* DeferredAudioContextService.use(context => context.currentTime)
      //       const remainingSeconds =
      //         state.playbackStartedAtSecond +
      //         durationSeconds -
      //         secondsSinceAudioContextInit
      //       yield* SubscriptionRef.updateEffect(
      //         stateRef,
      //         Effect.fn(function* (currentState) {
      //           if (
      //             currentState._tag !== 'SlowStrum' ||
      //             currentState.transitionQueue[0].playback !== playback
      //           )
      //             return currentState
      //           yield* cleanupAllPlaybacks(currentState)
      //           return { _tag: 'Silence' as const }
      //         }),
      //       ).pipe(
      //         stateSemaphore.withPermits(1),
      //         Effect.delay(Duration.seconds(Math.max(0, remainingSeconds))),
      //         Effect.tapCause(Effect.logError),
      //         Effect.forkDaemon,
      //       )
      //     }),
      //   ),
      //   Stream.runDrain,
      //   Effect.tapCause(Effect.logError),
      //   Effect.forkScoped,
      // )

      return {
        playStopButtonPressableFlagChangesStream,
        // switchPlayPauseFromCurrentlySelected,
        latestIsPlayingFlagStream,
        // тупо потому что не хочу усложнять себе работу
        playbackPublicInfoChangesStream: SubscriptionRef.changes(stateRef),
      }
    }).pipe(Effect.withSpan('AppPlaybackStateService.init'), Effect.orDie),
  },
) {
  static playStopButtonPressableFlagChangesStream = Stream.unwrap(
    this.useSync(s => s.playStopButtonPressableFlagChangesStream),
  )
}

export const AppPlaybackStateServiceLayer = Layer.effect(
  AppPlaybackStateService,
  AppPlaybackStateService.make,
)
