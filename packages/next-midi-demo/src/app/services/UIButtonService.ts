import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import * as ButtonState from '../helpers/ButtonState.ts'
import { streamAll } from '../helpers/streamAll.ts'
import { VirtualPadButtonModelToStrengthMappingService } from './VirtualPadButtonModelToStrengthMappingService.ts'

export class UIButtonService extends Effect.Service<UIButtonService>()(
  'next-midi-demo/UIButtonService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const selectedStrengthRef = yield* SubscriptionRef.make<Strength>('m')
      const selectedStrengthChanges = selectedStrengthRef.changes

      const selectStrength = (strength: Strength) =>
        SubscriptionRef.set(selectedStrengthRef, strength)

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

      yield* selectedStrengthChanges.pipe(
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
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      const { latestPhysicalButtonModelsStream } =
        yield* VirtualPadButtonModelToStrengthMappingService

      const getIsSelectedStrengthStream = (strength: Strength) =>
        selectedStrengthChanges.pipe(
          Stream.map(Equal.equals(strength)),
          Stream.tap(isSelected =>
            Effect.log(
              `Strength=${strength} is ${isSelected ? '' : 'not '}selected`,
            ),
          ),
        )

      const getStrengthButtonPressabilityChangesStream = (strength: Strength) =>
        Stream.map(
          streamAll({
            isPlaying: latestIsPlayingFlagStream,
            // taken externally, and could change over time
            completionStatusOfTheAssetThisButtonWouldSelect: Stream.succeed({
              status: 'finished',
            } as AssetCompletionStatus),
            isStrengthSelected: getIsSelectedStrengthStream(strength),
          }),
          req =>
            !req.isStrengthSelected &&
            (!req.isPlaying ||
              req.completionStatusOfTheAssetThisButtonWouldSelect.status ===
                'finished'),
        )

      yield* latestPhysicalButtonModelsStream.pipe(
        Stream.tap(() =>
          Effect.log(
            'VIRTUAL PAD button model to STRENGTH stream received value',
          ),
        ),
        Stream.tap(
          Effect.fn(function* ([, { buttonPressState, assignedTo }]) {
            if (ButtonState.isNotPressed(buttonPressState)) return

            const isStrengthButtonPressable = yield* EFunction.pipe(
              getStrengthButtonPressabilityChangesStream(assignedTo),
              Stream.take(1),
              Stream.runHead,
              Effect.map(Option.getOrThrow),
            )
            yield* Effect.log(
              'isStrengthButtonPressable: ',
              isStrengthButtonPressable,
            )

            if (isStrengthButtonPressable) yield* selectStrength(assignedTo)
          }),
        ),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      return { getIsSelectedStrengthStream }
    }),
  },
) {}

export const allStrengths = ['m', 'v', 's'] as const
export type AllStrengthTuple = typeof allStrengths
export type AppPlaybackState =
  | { readonly _tag: 'NotPlaying' }
  | { readonly _tag: 'Playing' }
export type Strength = AllStrengthTuple[number]
export interface CurrentSelectedAsset {
  readonly strength: Strength
}
export type AssetCompletionStatus =
  | { status: 'not finished'; currentBytes: number }
  | { status: 'almost finished: fetched, but not written' }
  | { status: 'finished' }
