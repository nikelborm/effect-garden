import * as Effect from 'effect/Effect'
import type * as Fiber from 'effect/Fiber'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { CurrentSelectedAsset } from './CurrentlySelectedAssetState.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

export class AppPlaybackStateService extends Effect.Service<AppPlaybackStateService>()(
  'next-midi-demo/AppPlaybackStateService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const strengthRegistry = yield* StrengthRegistry

      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>({
        _tag: 'NotPlaying',
      })

      const changeAsset = (latestAsset: any) =>
        SubscriptionRef.updateEffect(
          stateRef,
          Effect.fn(function* (oldPlayback) {
            yield* Effect.log('Attempting to change the playing asset')
            // imagine here would be conditions reacting to the previous state
            return oldPlayback
          }),
        ).pipe(
          Effect.andThen(Effect.log('Finished changing the playing asset')),
        )

      yield* strengthRegistry.selectedStrengthChanges.pipe(
        Stream.tap(changeAsset),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      const latestIsPlayingFlagStream = yield* stateRef.changes.pipe(
        Stream.map(cur => cur._tag !== 'NotPlaying'),
        Stream.changes,
        // I have zero fucking idea why, but this fucking 2 is holy and cannot
        // be changed.
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 2 }),
      )

      return {
        latestIsPlayingFlagStream,
      }
    }),
  },
) {}

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
