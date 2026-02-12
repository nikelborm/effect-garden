import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as Ref from 'effect/Ref'
import * as SortedMap from 'effect/SortedMap'
import * as SortedSet from 'effect/SortedSet'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
import { ButtonState } from '../branded/index.ts'
import {
  type NoteId,
  type NoteIdData,
  NoteIdDataOrder,
  NoteIdOrder,
} from '../branded/MIDIValues.ts'
import {
  type ValidKeyboardKey,
  type ValidKeyboardKeyData,
  ValidKeyboardKeyDataOrder,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'
import { streamAll } from '../helpers/streamAll.ts'
import {
  type Accord,
  type AccordIndexData,
  AccordIndexDataOrder,
  AccordOrderByIndex,
  AccordRegistry,
  type AllAccordUnion,
} from './AccordRegistry.ts'
import { AppPlaybackStateService } from './AppPlaybackStateService.ts'
import { AssetDownloadScheduler } from './AssetDownloadScheduler.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import {
  type AssetCompletionStatus,
  LoadedAssetSizeEstimationMap,
} from './LoadedAssetSizeEstimationMap.ts'
import type { PhysicalButtonModel } from './makePhysicalButtonToParamMappingService.ts'
import {
  type AllPatternUnion,
  type PatternIndexData,
  PatternIndexDataOrder,
  PatternOrderByIndex,
  PatternRegistry,
  type Pattern as pattern,
} from './PatternRegistry.ts'
import { PhysicalKeyboardButtonModelToAccordMappingService } from './PhysicalKeyboardButtonModelToAccordMappingService.ts'
import { PhysicalKeyboardButtonModelToPatternMappingService } from './PhysicalKeyboardButtonModelToPatternMappingService.ts'
import { PhysicalKeyboardButtonModelToStrengthMappingService } from './PhysicalKeyboardButtonModelToStrengthMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToAccordMappingService } from './PhysicalMIDIDeviceButtonModelToAccordMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToPatternMappingService } from './PhysicalMIDIDeviceButtonModelToPatternMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToStrengthMappingService } from './PhysicalMIDIDeviceButtonModelToStrengthMappingService.ts'
import {
  type StrengthData,
  StrengthDataOrder,
  StrengthRegistry,
} from './StrengthRegistry.ts'
import { VirtualPadButtonModelToAccordMappingService } from './VirtualPadButtonModelToAccordMappingService.ts'
import { VirtualPadButtonModelToPatternMappingService } from './VirtualPadButtonModelToPatternMappingService.ts'
import { VirtualPadButtonModelToStrengthMappingService } from './VirtualPadButtonModelToStrengthMappingService.ts'

export class UIButtonService extends Effect.Service<UIButtonService>()(
  'next-midi-demo/UIButtonService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const accordRegistry = yield* AccordRegistry
      const patternRegistry = yield* PatternRegistry
      const strengthRegistry = yield* StrengthRegistry
      const appPlaybackState = yield* AppPlaybackStateService
      const currentlySelectedAssetState = yield* CurrentlySelectedAssetState
      const loadedAssetSizeEstimationMap = yield* LoadedAssetSizeEstimationMap
      const assetDownloadScheduler = yield* AssetDownloadScheduler
      const physicalKeyboardButtonModelToAccordMappingService =
        yield* PhysicalKeyboardButtonModelToAccordMappingService
      const physicalKeyboardButtonModelToPatternMappingService =
        yield* PhysicalKeyboardButtonModelToPatternMappingService
      const physicalKeyboardButtonModelToStrengthMappingService =
        yield* PhysicalKeyboardButtonModelToStrengthMappingService

      const physicalMIDIDeviceButtonModelToAccordMappingService =
        yield* PhysicalMIDIDeviceButtonModelToAccordMappingService
      const physicalMIDIDeviceButtonModelToPatternMappingService =
        yield* PhysicalMIDIDeviceButtonModelToPatternMappingService
      const physicalMIDIDeviceButtonModelToStrengthMappingService =
        yield* PhysicalMIDIDeviceButtonModelToStrengthMappingService

      const virtualPadButtonModelToAccordMappingService =
        yield* VirtualPadButtonModelToAccordMappingService
      const virtualPadButtonModelToPatternMappingService =
        yield* VirtualPadButtonModelToPatternMappingService
      const virtualPadButtonModelToStrengthMappingService =
        yield* VirtualPadButtonModelToStrengthMappingService

      const accordButtonsMapRef = yield* Ref.make<AccordButtonMap>(
        SortedMap.empty(AccordOrderByIndex),
      )

      // TODO: нужно сделать чтобы визуально прожимались только те, которые
      // могут визуально прожиматься на текущий момент

      // TODO: при одновременном нажатии нескольких клавиш (внутри секции
      // аккордов или внутри секции паттернов, где секции не зависят друг от
      // друга), нужно событие активации чтобы срабатывало только после того как
      // отпущена последняя из нескольких нажатых клавиш

      // стейт нажатия кнопки считается так: если может нажиматься, показывается нажатие

      // TODO: в банальном варианте onDown событие ставит активную клавишу

      // TODO: блокировать нажатия кнопок на ранних стадиях. Нажатие на кнопку
      // паттерна/аккорда, как и её отпускание должны просто игнорироваться,
      // если по логике кнопка должна быть заблокирована

      // В момент активного плейбека может стать кандидатом на переключение
      // только та кнопка паттерна/аккорда, которая загружена полностью

      const patternButtonsMapRef = yield* Ref.make<PatternButtonMap>(
        SortedMap.empty(PatternOrderByIndex),
      )

      const playStopButtonPressableFlagChangesStream = yield* EFunction.pipe(
        appPlaybackState.latestIsPlayingFlagStream,
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

      const getIsSelectedAccordStream = (accord: AllAccordUnion) =>
        accordRegistry.selectedAccordChanges.pipe(
          Stream.map(Equal.equals(accord)),
          Stream.changes,
          Stream.tap(isSelected =>
            Effect.log(
              `Accord index=${accord.index} is ${isSelected ? '' : 'not '}selected`,
            ),
          ),
        )

      const getIsSelectedPatternStream = (pattern: AllPatternUnion) =>
        patternRegistry.selectedPatternChanges.pipe(
          Stream.map(Equal.equals(pattern)),
          Stream.changes,
        )

      const getIsSelectedStrengthStream = (strength: Strength) =>
        strengthRegistry.selectedStrengthChanges.pipe(
          Stream.map(Equal.equals(strength)),
          Stream.changes,
        )

      const getAccordButtonPressabilityChangesStream = (
        accord: AllAccordUnion,
      ) =>
        streamAll({
          isPlaying: appPlaybackState.latestIsPlayingFlagStream,
          completionStatusOfTheAssetThisButtonWouldSelect:
            currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
              accord,
            ),
          isSelectedParam: getIsSelectedAccordStream(accord),
        }).pipe(isPressable)

      const getPatternButtonPressabilityChangesStream = (
        pattern: AllPatternUnion,
      ) =>
        streamAll({
          isPlaying: appPlaybackState.latestIsPlayingFlagStream,
          completionStatusOfTheAssetThisButtonWouldSelect:
            currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
              pattern,
            ),
          isSelectedParam: getIsSelectedPatternStream(pattern),
        }).pipe(isPressable)

      const getStrengthButtonPressabilityChangesStream = (strength: Strength) =>
        streamAll({
          isPlaying: appPlaybackState.latestIsPlayingFlagStream,
          completionStatusOfTheAssetThisButtonWouldSelect:
            currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
              strength,
            ),
          isSelectedParam: getIsSelectedStrengthStream(strength),
        }).pipe(isPressable)

      const isAccordButtonCurrentlyPlaying = (accord: AllAccordUnion) =>
        appPlaybackState.playbackPublicInfoChangesStream.pipe(
          Stream.map(
            pb =>
              pb._tag !== 'NotPlaying' &&
              Equal.equals(pb.currentAsset.accord, accord),
          ),
          Stream.changes,
        )
      const isPatternButtonCurrentlyPlaying = (pattern: AllPatternUnion) =>
        appPlaybackState.playbackPublicInfoChangesStream.pipe(
          Stream.map(
            pb =>
              pb._tag !== 'NotPlaying' &&
              Equal.equals(pb.currentAsset.pattern, pattern),
          ),
          Stream.changes,
        )
      const isStrengthButtonCurrentlyPlaying = (strength: Strength) =>
        appPlaybackState.playbackPublicInfoChangesStream.pipe(
          Stream.map(
            pb =>
              pb._tag !== 'NotPlaying' && pb.currentAsset.strength === strength,
          ),
          Stream.changes,
        )

      // Currently selected asset is always the asset that will be played next

      const getAccordButtonDownloadPercent = (accord: AllAccordUnion) =>
        currentlySelectedAssetState
          .getPatchedAssetFetchingCompletionStatusChangesStream(accord)
          .pipe(
            Stream.map(s =>
              s.status === 'not finished'
                ? Math.floor((s.currentBytes / ASSET_SIZE_BYTES) * 100)
                : s.status === 'fetched, but not written'
                  ? 99
                  : 100,
            ),
            Stream.changes,
          )

      const getPatternButtonDownloadPercent = (pattern: AllPatternUnion) =>
        currentlySelectedAssetState
          .getPatchedAssetFetchingCompletionStatusChangesStream(pattern)
          .pipe(
            Stream.map(s =>
              s.status === 'not finished'
                ? Math.floor((s.currentBytes / ASSET_SIZE_BYTES) * 100)
                : s.status === 'fetched, but not written'
                  ? 99
                  : 100,
            ),
            Stream.changes,
          )

      const getStrengthButtonDownloadPercent = (strength: Strength) =>
        currentlySelectedAssetState
          .getPatchedAssetFetchingCompletionStatusChangesStream(strength)
          .pipe(
            Stream.map(s =>
              s.status === 'not finished'
                ? Math.floor((s.currentBytes / ASSET_SIZE_BYTES) * 100)
                : s.status === 'fetched, but not written'
                  ? 99
                  : 100,
            ),
            Stream.changes,
          )

      const getMapCombinerStream =
        <T>() =>
        <E, R>(
          self: Stream.Stream<
            SupportedKeyData extends infer Key
              ? Key extends any
                ? SortedMap.SortedMap<Key, PhysicalButtonModel<T>>
                : never
              : never,
            E,
            R
          >,
        ) =>
          Stream.scan(
            self,
            HashMap.empty<T, SortedSet.SortedSet<SupportedKeyData>>(),
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
          )

      const AccordPressAggregateStream =
        yield* physicalKeyboardButtonModelToAccordMappingService.mapChanges.pipe(
          Stream.merge(
            physicalMIDIDeviceButtonModelToAccordMappingService.mapChanges,
          ),
          Stream.merge(virtualPadButtonModelToAccordMappingService.mapChanges),
          getMapCombinerStream<AllAccordUnion>(),
          Stream.changes,
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      yield* physicalKeyboardButtonModelToAccordMappingService.latestPhysicalButtonModelsStream.pipe(
        Stream.merge(
          physicalMIDIDeviceButtonModelToAccordMappingService.latestPhysicalButtonModelsStream,
        ),
        Stream.merge(
          virtualPadButtonModelToAccordMappingService.latestPhysicalButtonModelsStream,
        ),
        Stream.tap(
          Effect.fn(function* ([, { buttonPressState, assignedTo }]) {
            if (ButtonState.isNotPressed(buttonPressState)) return

            const isAccordButtonPressable = yield* EFunction.pipe(
              getAccordButtonPressabilityChangesStream(assignedTo),
              Stream.take(1),
              Stream.runHead,
              Effect.map(Option.getOrThrow),
            )

            if (isAccordButtonPressable)
              yield* accordRegistry.selectAccord(assignedTo.index)
          }),
        ),
        Stream.runDrain,
        Effect.forkScoped,
      )

      yield* physicalKeyboardButtonModelToPatternMappingService.latestPhysicalButtonModelsStream.pipe(
        Stream.merge(
          physicalMIDIDeviceButtonModelToPatternMappingService.latestPhysicalButtonModelsStream,
        ),
        Stream.merge(
          virtualPadButtonModelToPatternMappingService.latestPhysicalButtonModelsStream,
        ),
        Stream.tap(
          Effect.fn(function* ([, { buttonPressState, assignedTo }]) {
            if (ButtonState.isNotPressed(buttonPressState)) return

            const isPatternButtonPressable = yield* EFunction.pipe(
              getPatternButtonPressabilityChangesStream(assignedTo),
              Stream.take(1),
              Stream.runHead,
              Effect.map(Option.getOrThrow),
            )

            if (isPatternButtonPressable)
              yield* patternRegistry.selectPattern(assignedTo.index)
          }),
        ),
        Stream.runDrain,
        Effect.forkScoped,
      )

      yield* physicalKeyboardButtonModelToStrengthMappingService.latestPhysicalButtonModelsStream.pipe(
        Stream.merge(
          physicalMIDIDeviceButtonModelToStrengthMappingService.latestPhysicalButtonModelsStream,
        ),
        Stream.merge(
          virtualPadButtonModelToStrengthMappingService.latestPhysicalButtonModelsStream,
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
        Effect.forkScoped,
      )

      const isAccordButtonPressedFlagChangesStream = (accord: AllAccordUnion) =>
        AccordPressAggregateStream.pipe(
          Stream.map(
            EFunction.flow(
              HashMap.get(accord),
              Option.map(set => SortedSet.size(set) !== 0),
              Option.getOrElse(() => false),
            ),
          ),
          Stream.changes,
          Stream.tap(isPressed =>
            Effect.log(
              `accord index=${accord.index} is ${isPressed ? '' : 'not '}pressed`,
            ),
          ),
        )

      const PatternPressAggregateStream =
        yield* physicalKeyboardButtonModelToPatternMappingService.mapChanges.pipe(
          Stream.merge(
            physicalMIDIDeviceButtonModelToPatternMappingService.mapChanges,
          ),
          Stream.merge(virtualPadButtonModelToPatternMappingService.mapChanges),
          getMapCombinerStream<AllPatternUnion>(),
          Stream.changes,
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      const isPatternButtonPressedFlagChangesStream = (
        pattern: AllPatternUnion,
      ) =>
        PatternPressAggregateStream.pipe(
          Stream.map(
            EFunction.flow(
              HashMap.get(pattern),
              Option.map(set => SortedSet.size(set) !== 0),
              Option.getOrElse(() => false),
            ),
          ),
          Stream.changes,
          Stream.tap(isPressed =>
            Effect.log(
              `pattern index=${pattern.index} is ${isPressed ? '' : 'not '}pressed`,
            ),
          ),
        )

      const StrengthPressAggregateStream =
        yield* physicalKeyboardButtonModelToStrengthMappingService.mapChanges.pipe(
          Stream.merge(
            physicalMIDIDeviceButtonModelToStrengthMappingService.mapChanges,
          ),
          Stream.merge(
            virtualPadButtonModelToStrengthMappingService.mapChanges,
          ),
          getMapCombinerStream<Strength>(),
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

      const getPressureReportOfAccord =
        getPressureReportOfMapRef(accordButtonsMapRef)

      const getPressureReportOfPattern =
        getPressureReportOfMapRef(patternButtonsMapRef)

      return {
        playStopButtonPressableFlagChangesStream,
        getPressureReportOfAccord,
        getPressureReportOfPattern,
        getIsSelectedAccordStream,
        getIsSelectedPatternStream,
        getIsSelectedStrengthStream,
        getAccordButtonPressabilityChangesStream,
        getPatternButtonPressabilityChangesStream,
        getStrengthButtonPressabilityChangesStream,
        isAccordButtonCurrentlyPlaying,
        isPatternButtonCurrentlyPlaying,
        isStrengthButtonCurrentlyPlaying,
        getAccordButtonDownloadPercent,
        getPatternButtonDownloadPercent,
        getStrengthButtonDownloadPercent,
        isAccordButtonPressedFlagChangesStream,
        isPatternButtonPressedFlagChangesStream,
        isStrengthButtonPressedFlagChangesStream,
      }
    }),
  },
) {}

const defaultReportOnNone = EFunction.flow(
  Option.orElseSome(
    (): PressureReport => ({
      isActive: false,
      pressedByKeyboardKeys: SortedSet.empty(ValidKeyboardKeyOrder),
      pressedByMIDIPadButtons: SortedSet.empty(NoteIdOrder),
    }),
  )<PressureReport>,
  Option.getOrThrow,
)

const getPressureReportOfMapRef =
  <TAssignee>(assigneeMapRef: PressureReportMapRef<TAssignee>) =>
  (assignee: TAssignee) =>
    Effect.map(
      Ref.get(assigneeMapRef),
      EFunction.flow(SortedMap.get(assignee), defaultReportOnNone),
    )

export interface PressureReport {
  isActive: boolean
  pressedByKeyboardKeys: SortedSet.SortedSet<ValidKeyboardKey>
  pressedByMIDIPadButtons: SortedSet.SortedSet<NoteId>
}

interface AccordButtonMap extends PressureReportMap<Accord> {}

interface PatternButtonMap extends PressureReportMap<pattern> {}

interface PressureReportMap<Key>
  extends SortedMap.SortedMap<Key, PressureReport> {}

interface PressureReportMapRef<Key> extends Ref.Ref<PressureReportMap<Key>> {}

interface ButtonPressabilityDecisionRequirements {
  readonly isPlaying: boolean
  readonly completionStatusOfTheAssetThisButtonWouldSelect: AssetCompletionStatus
  readonly isSelectedParam: boolean
}

const asd = {
  NoteId: 0,
  ValidKeyboardKey: 1,
  AccordIndex: 2,
  PatternIndex: 3,
  Strength: 4,
} as const

const OrderByKeyData = Order.combine(
  Order.mapInput(Order.number, (a: SupportedKeyData) => asd[a._tag]),
  Order.make((self: SupportedKeyData, that: SupportedKeyData) => {
    if (self._tag === 'NoteId' && that._tag === 'NoteId')
      return NoteIdDataOrder(self, that)

    if (self._tag === 'ValidKeyboardKey' && that._tag === 'ValidKeyboardKey')
      return ValidKeyboardKeyDataOrder(self, that)

    if (self._tag === 'AccordIndex' && that._tag === 'AccordIndex')
      return AccordIndexDataOrder(self, that)

    if (self._tag === 'PatternIndex' && that._tag === 'PatternIndex')
      return PatternIndexDataOrder(self, that)

    if (self._tag === 'Strength' && that._tag === 'Strength')
      return StrengthDataOrder(self, that)

    throw new Error('Unsortable')
  }),
)

type SupportedKeyData =
  | ValidKeyboardKeyData
  | NoteIdData
  | AccordIndexData
  | StrengthData
  | PatternIndexData
