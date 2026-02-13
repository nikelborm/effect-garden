import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import type { Strength } from '../helpers/audioAssetHelpers.ts'
import * as ButtonState from '../helpers/ButtonState.ts'
import type { AssetCompletionStatus } from '../helpers/CurrentlySelectedAssetState.ts'
import { streamAll } from '../helpers/streamAll.ts'
import { AppPlaybackStateService } from './AppPlaybackStateService.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'
import { VirtualPadButtonModelToStrengthMappingService } from './VirtualPadButtonModelToStrengthMappingService.ts'

export class UIButtonService extends Effect.Service<UIButtonService>()(
  'next-midi-demo/UIButtonService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const strengthRegistry = yield* StrengthRegistry
      const appPlaybackState = yield* AppPlaybackStateService

      const virtualPadButtonModelToStrengthMappingService =
        yield* VirtualPadButtonModelToStrengthMappingService

      const getIsSelectedStrengthStream = (strength: Strength) =>
        strengthRegistry.selectedStrengthChanges.pipe(
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
            isPlaying: appPlaybackState.latestIsPlayingFlagStream,
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

      yield* virtualPadButtonModelToStrengthMappingService.latestPhysicalButtonModelsStream.pipe(
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

            if (isStrengthButtonPressable)
              yield* strengthRegistry.selectStrength(assignedTo)
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
