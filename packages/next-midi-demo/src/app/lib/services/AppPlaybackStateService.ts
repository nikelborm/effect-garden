import * as Effect from 'effect/Effect'
import type * as Fiber from 'effect/Fiber'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  CurrentlySelectedAssetState,
  type CurrentSelectedAsset,
} from './CurrentlySelectedAssetState.ts'

export class AppPlaybackStateService extends Effect.Service<AppPlaybackStateService>()(
  'next-midi-demo/AppPlaybackStateService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const selectedAssetState = yield* CurrentlySelectedAssetState

      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>({
        _tag: 'NotPlaying',
      })

      const current = SubscriptionRef.get(stateRef)

      const changesStream = yield* stateRef.changes.pipe(
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      const changeAsset = (asset: CurrentSelectedAsset) =>
        SubscriptionRef.updateEffect(
          stateRef,
          Effect.fn(function* (oldPlayback) {
            yield* Effect.log('Attempting to change the playing asset')
            return oldPlayback
          }),
        ).pipe(
          Effect.andThen(Effect.log('Finished changing the playing asset')),
        )

      const isPlaying = (current: AppPlaybackState) =>
        current._tag !== 'NotPlaying'

      const isCurrentlyPlayingEffect = Effect.map(current, isPlaying)
      const latestIsPlayingFlagStream = yield* changesStream.pipe(
        Stream.map(isPlaying),
        Stream.changes,
        // I have zero fucking idea why, but this fucking 2 is holy and cannot
        // be changed.
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 2 }),
      )

      yield* selectedAssetState.changes.pipe(
        Stream.tap(changeAsset),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      return {
        isCurrentlyPlayingEffect,
        latestIsPlayingFlagStream,
        playbackPublicInfoChangesStream: Stream.map(changesStream, e =>
          e._tag === 'NotPlaying' ? e : Struct.pick(e, '_tag', 'currentAsset'),
        ),
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
