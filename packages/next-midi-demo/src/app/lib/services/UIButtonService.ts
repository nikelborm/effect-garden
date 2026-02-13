import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as SortedSet from 'effect/SortedSet'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
import { ButtonState } from '../branded/index.ts'
import { streamAll } from '../helpers/streamAll.ts'
import { AppPlaybackStateService } from './AppPlaybackStateService.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import type { AssetCompletionStatus } from './LoadedAssetSizeEstimationMap.ts'
import {
  type StrengthData,
  StrengthDataOrder,
  StrengthRegistry,
} from './StrengthRegistry.ts'
import { VirtualPadButtonModelToStrengthMappingService } from './VirtualPadButtonModelToStrengthMappingService.ts'

export class UIButtonService extends Effect.Service<UIButtonService>()(
  'next-midi-demo/UIButtonService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const strengthRegistry = yield* StrengthRegistry
      const appPlaybackState = yield* AppPlaybackStateService
      const currentlySelectedAssetState = yield* CurrentlySelectedAssetState

      const virtualPadButtonModelToStrengthMappingService =
        yield* VirtualPadButtonModelToStrengthMappingService

      const isPressable = <E, R>(
        self: Stream.Stream<ButtonPressabilityDecisionRequirements, E, R>,
      ) =>
        self.pipe(
          Stream.map(
            req =>
              !req.isSelectedParam &&
              (!req.isPlaying ||
                req.completionStatusOfTheAssetThisButtonWouldSelect.status ===
                  'finished'),
          ),
          Stream.changes,
        )

      const getIsSelectedStrengthStream = (strength: Strength) =>
        strengthRegistry.selectedStrengthChanges.pipe(
          Stream.map(Equal.equals(strength)),
          Stream.changes,
          Stream.tap(isSelected =>
            Effect.log(
              `Strength=${strength} is ${isSelected ? '' : 'not '}selected`,
            ),
          ),
        )

      const getStrengthButtonPressabilityChangesStream = (strength: Strength) =>
        streamAll({
          isPlaying: appPlaybackState.latestIsPlayingFlagStream,
          completionStatusOfTheAssetThisButtonWouldSelect:
            currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
              strength,
            ),
          isSelectedParam: getIsSelectedStrengthStream(strength),
        }).pipe(isPressable)

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

            if (isStrengthButtonPressable)
              yield* strengthRegistry.selectStrength(assignedTo)
          }),
        ),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      const StrengthPressAggregateStream =
        yield* virtualPadButtonModelToStrengthMappingService.mapChanges.pipe(
          Stream.scan(
            HashMap.empty<Strength, SortedSet.SortedSet<SupportedKeyData>>(),
            (previousMap, latestMap) => {
              let newMap = previousMap
              for (const [physicalButtonId, physicalButtonModel] of latestMap)
                newMap = HashMap.modifyAt(
                  newMap,
                  physicalButtonModel.assignedTo,
                  EFunction.flow(
                    Option.orElseSome(() => SortedSet.empty(OrderByKeyData)),
                    Option.map(setOfPhysicalIdsTheButtonIsPressedBy =>
                      (physicalButtonModel.buttonPressState ===
                        ButtonState.Pressed
                        ? SortedSet.add
                        : SortedSet.remove)(
                        setOfPhysicalIdsTheButtonIsPressedBy,
                        physicalButtonId,
                      ),
                    ),
                  ),
                )
              return newMap
            },
          ),
          Stream.changes,
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      const isStrengthButtonPressedFlagChangesStream = (strength: Strength) =>
        StrengthPressAggregateStream.pipe(
          Stream.map(
            EFunction.flow(
              HashMap.get(strength),
              Option.map(set => SortedSet.size(set) !== 0),
              Option.getOrElse(() => false),
            ),
          ),
          Stream.changes,
          Stream.tap(isPressed =>
            Effect.log(
              `strength=${strength} is ${isPressed ? '' : 'not '}pressed`,
            ),
          ),
        )

      return {
        getIsSelectedStrengthStream,
        getStrengthButtonPressabilityChangesStream,
        isStrengthButtonPressedFlagChangesStream,
      }
    }),
  },
) {}

interface ButtonPressabilityDecisionRequirements {
  readonly isPlaying: boolean
  readonly completionStatusOfTheAssetThisButtonWouldSelect: AssetCompletionStatus
  readonly isSelectedParam: boolean
}

const asd = {
  Strength: 4,
} as const

const OrderByKeyData = Order.combine(
  Order.mapInput(Order.number, (a: SupportedKeyData) => asd[a._tag]),
  Order.make((self: SupportedKeyData, that: SupportedKeyData) => {
    if (self._tag === 'Strength' && that._tag === 'Strength')
      return StrengthDataOrder(self, that)

    throw new Error('Unsortable')
  }),
)

type SupportedKeyData = StrengthData
