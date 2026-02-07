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
import { type NoteId, NoteIdOrder } from '../branded/MIDIValues.ts'
import {
  type ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import { sortedMapModify } from '../helpers/sortedMapModifyAt.ts'
import { streamAll } from '../helpers/streamAll.ts'
import {
  type Accord,
  AccordOrderById,
  AccordRegistry,
  type AllAccordUnion,
} from './AccordRegistry.ts'
import { AppPlaybackStateService } from './AppPlaybackStateService.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import type { PhysicalButtonModel } from './makePhysicalButtonToParamMappingService.ts'
import {
  type AllPatternUnion,
  PatternOrderByIndex,
  PatternRegistry,
  type Pattern as pattern,
} from './PatternRegistry.ts'
import { PhysicalKeyboardButtonModelToAccordMappingService } from './PhysicalKeyboardButtonModelToAccordMappingService.ts'
import { PhysicalKeyboardButtonModelToPatternMappingService } from './PhysicalKeyboardButtonModelToPatternMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToAccordMappingService } from './PhysicalMIDIDeviceButtonModelToAccordMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToPatternMappingService } from './PhysicalMIDIDeviceButtonModelToPatternMappingService.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

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
      const physicalKeyboardButtonModelToAccordMappingService =
        yield* PhysicalKeyboardButtonModelToAccordMappingService
      const physicalKeyboardButtonModelToPatternMappingService =
        yield* PhysicalKeyboardButtonModelToPatternMappingService
      const physicalMIDIDeviceButtonModelToAccordMappingService =
        yield* PhysicalMIDIDeviceButtonModelToAccordMappingService
      const physicalMIDIDeviceButtonModelToPatternMappingService =
        yield* PhysicalMIDIDeviceButtonModelToPatternMappingService

      const accordButtonsMapRef = yield* Ref.make<AccordButtonMap>(
        SortedMap.empty(AccordOrderById),
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

      const isPlayStopButtonPressable = Effect.gen(function* () {
        const isPlaying = yield* appPlaybackState.isCurrentlyPlayingEffect

        if (isPlaying) return true
        const status = yield* currentlySelectedAssetState.completionStatus
        return status === 'finished'
      })

      const isPressable = <E, R>(
        self: Stream.Stream<ButtonPressabilityDecisionRequirements, E, R>,
      ) =>
        self.pipe(
          Stream.map(
            _ =>
              !_.isSelectedParam &&
              (!_.isPlaying ||
                _.completionStatusOfTheAssetThisButtonWouldSelect ===
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
          // Completion status of the asset this button would select
          completionStatusOfTheAssetThisButtonWouldSelect:
            currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
              accord,
            ),
          isSelectedParam: getIsSelectedAccordStream(accord),
        }).pipe(
          Stream.tap(e => Effect.log('marker1', e)),
          Stream.tapErrorCause(e => Effect.logError('marker2', e)),
          isPressable,
        )

      const getPatternButtonPressabilityChangesStream = (
        pattern: AllPatternUnion,
      ) =>
        streamAll({
          isPlaying: appPlaybackState.latestIsPlayingFlagStream,
          // Completion status of the asset this button would select
          completionStatusOfTheAssetThisButtonWouldSelect:
            currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
              pattern,
            ),
          isSelectedParam: getIsSelectedPatternStream(pattern),
        }).pipe(isPressable)

      const getStrengthButtonPressabilityChangesStream = (strength: Strength) =>
        streamAll({
          isPlaying: appPlaybackState.latestIsPlayingFlagStream,
          // Completion status of the asset this button would select
          completionStatusOfTheAssetThisButtonWouldSelect:
            currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
              strength,
            ),
          isSelectedParam: getIsSelectedStrengthStream(strength),
        }).pipe(isPressable)

      const isAccordButtonCurrentlyPlaying = () => {}
      const isPatternButtonCurrentlyPlaying = () => {}
      const isStrengthButtonCurrentlyPlaying = () => {}

      const isAccordButtonWillBePlayedNext = () => {}
      const isPatternButtonWillBePlayedNext = () => {}
      const isStrengthButtonWillBePlayedNext = () => {}

      const getAccordButtonDownloadPercent = () => {}
      const getPatternButtonDownloadPercent = () => {}
      const getStrengthButtonDownloadPercent = () => {}

      // when isn't presently playing audio. default.
      // pattern/accord/strength buttons states:

      // 1. in-process loading, includes when the asset is 0% loaded
      // 2. finished   loading, asset is completely loaded and written to opfs

      // 1. selected as a current setting
      // 2. not selected as a current setting

      const getMapCombinerStream =
        <T>() =>
        <E, R>(
          self: Stream.Stream<
            | SortedMap.SortedMap<ValidKeyboardKey, PhysicalButtonModel<T>>
            | SortedMap.SortedMap<NoteId, PhysicalButtonModel<T>>,
            E,
            R
          >,
        ) =>
          Stream.scan(
            self,
            HashMap.empty<T, SortedSet.SortedSet<ValidKeyboardKey | NoteId>>(),
            (previousMap, latestMap) => {
              let newMap = previousMap
              for (const [physicalButtonId, physicalButtonModel] of latestMap)
                newMap = HashMap.modifyAt(
                  newMap,
                  physicalButtonModel.assignedTo,
                  EFunction.flow(
                    Option.orElseSome(() => SortedSet.empty(noteOrKeyOrder)),
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
          getMapCombinerStream<AllAccordUnion>(),
          Stream.changes,
          Stream.share({ capacity: 'unbounded', replay: 1 }),
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
          getMapCombinerStream<AllPatternUnion>(),
          Stream.changes,
          Stream.share({ capacity: 'unbounded', replay: 1 }),
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

      const getPressureReportOfAccord =
        getPressureReportOfMapRef(accordButtonsMapRef)

      const getPressureReportOfPattern =
        getPressureReportOfMapRef(patternButtonsMapRef)

      return {
        isPlayStopButtonPressable,
        getPressureReportOfAccord,
        getPressureReportOfPattern,
        getIsSelectedAccordStream,
        getIsSelectedPatternStream,
        getIsSelectedStrengthStream,
        getAccordButtonPressabilityChangesStream,
        getPatternButtonPressabilityChangesStream,
        getStrengthButtonPressabilityChangesStream,
        isAccordButtonPressedFlagChangesStream,
        isPatternButtonPressedFlagChangesStream,
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

const transformReportGeneric =
  <const TReportKey extends keyof PressureReport>(
    key: TReportKey,
    transformReportField: (
      previous: PressureReport[TReportKey],
    ) => PressureReport[TReportKey],
  ) =>
  <TAssignee>(assignee: TAssignee, mapRef: PressureReportMapRef<TAssignee>) =>
    Ref.update(
      mapRef,
      sortedMapModify(assignee, previousReport => ({
        ...previousReport,
        [key]: transformReportField(previousReport[key]),
      })),
    )

const isButtonPressed =
  <TAssignee>(
    getReport: (assignee: TAssignee) => Effect.Effect<PressureReport>,
  ) =>
  (assignee: TAssignee) =>
    Effect.map(
      getReport(assignee),
      report =>
        SortedSet.size(report.pressedByKeyboardKeys) > 0 ||
        SortedSet.size(report.pressedByMIDIPadButtons) > 0,
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
  readonly completionStatusOfTheAssetThisButtonWouldSelect:
    | 'not finished'
    | 'fetched, but not written'
    | 'finished'
  readonly isSelectedParam: boolean
}

const noteOrKeyOrder = Order.make(
  (self: ValidKeyboardKey | NoteId, that: ValidKeyboardKey | NoteId) =>
    typeof self === 'number' && typeof that === 'number'
      ? NoteIdOrder(self, that)
      : typeof self === 'string' && typeof that === 'string'
        ? ValidKeyboardKeyOrder(self, that)
        : typeof self === 'number' && typeof that === 'string'
          ? 1
          : -1,
)
