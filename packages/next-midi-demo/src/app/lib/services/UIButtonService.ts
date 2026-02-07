import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as SortedMap from 'effect/SortedMap'
import * as SortedSet from 'effect/SortedSet'

import type { Strength } from '../audioAssetHelpers.ts'
import { ButtonState } from '../branded/index.ts'
import { type NoteId, NoteIdOrder } from '../branded/MIDIValues.ts'
import {
  type ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import { reactivelySchedule } from '../helpers/reactiveFiberScheduler.ts'
import { sortedMapModify } from '../helpers/sortedMapModifyAt.ts'
import {
  Accord,
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
  Pattern as pattern,
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
        const isPlaying = yield* appPlaybackState.isPlaying

        if (isPlaying) return true
        const status = yield* currentlySelectedAssetState.completionStatus
        return status === 'finished'
      })

      const isAccordButtonPressable = Effect.fn(function* (
        accord: AllAccordUnion,
      ) {
        const isPlaying = yield* appPlaybackState.isPlaying
        const completionStatusOfTheAssetThisButtonWouldSelect =
          yield* currentlySelectedAssetState.completionStatusOfPatched(accord)
        const doesAccordDifferFromTheCurrentlyActive = !Equal.equals(
          accord,
          yield* accordRegistry.currentlyActiveAccord,
        )
        return (
          doesAccordDifferFromTheCurrentlyActive &&
          (!isPlaying ||
            completionStatusOfTheAssetThisButtonWouldSelect === 'finished')
        )
      })
      const isPatternButtonPressable = Effect.fn(function* (
        pattern: AllPatternUnion,
      ) {
        const isPlaying = yield* appPlaybackState.isPlaying
        const completionStatusOfTheAssetThisButtonWouldSelect =
          yield* currentlySelectedAssetState.completionStatusOfPatched(pattern)
        const doesPatternDifferFromTheCurrentlyActive = !Equal.equals(
          pattern,
          yield* patternRegistry.currentlyActivePattern,
        )
        return (
          doesPatternDifferFromTheCurrentlyActive &&
          (!isPlaying ||
            completionStatusOfTheAssetThisButtonWouldSelect === 'finished')
        )
      })
      const isStrengthButtonPressable = Effect.fn(function* (
        strength: Strength,
      ) {
        const isPlaying = yield* appPlaybackState.isPlaying
        const completionStatusOfTheAssetThisButtonWouldSelect =
          yield* currentlySelectedAssetState.completionStatusOfPatched(strength)
        const doesStrengthDifferFromTheCurrentlyActive =
          strength !== (yield* strengthRegistry.currentlyActiveStrength)
        return (
          doesStrengthDifferFromTheCurrentlyActive &&
          (!isPlaying ||
            completionStatusOfTheAssetThisButtonWouldSelect === 'finished')
        )
      })

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

      //

      const makeSortedMapUpdater =
        <
          const TReportKey extends
            | 'pressedByKeyboardKeys'
            | 'pressedByMIDIPadButtons',
        >(
          key: TReportKey,
        ) =>
        <AssignedTo>(
          map: SortedMap.SortedMap<
            PressureReport[TReportKey] extends SortedSet.SortedSet<infer V>
              ? V
              : never,
            PhysicalButtonModel<AssignedTo>
          >,
        ) =>
          Effect.forEach(
            map,
            Effect.fn(function* ([id, model]) {
              const transformReport = transformReportGeneric(
                key,
                prevValAtKey =>
                  model.buttonPressState === ButtonState.Pressed
                    ? SortedSet.add(prevValAtKey, id as any)
                    : SortedSet.remove(prevValAtKey, id as any),
              )
              if (pattern.models(model.assignedTo))
                yield* transformReport(model.assignedTo, patternButtonsMapRef)

              if (Accord.models(model.assignedTo))
                yield* transformReport(model.assignedTo, accordButtonsMapRef)
            }),
            { discard: true },
          )

      const updatePressedByKeyboardKeys = makeSortedMapUpdater(
        'pressedByKeyboardKeys',
      )
      const updatePressedByMIDIPadButtons = makeSortedMapUpdater(
        'pressedByMIDIPadButtons',
      )

      // Seems like wont be needed, since .changes also emits on initialization
      // yield* Effect.flatMap(
      //   physicalKeyboardKeyModelToUIButtonMappingService.currentMap,
      //   updatePressedByKeyboardKeys,
      // )

      // yield* Effect.flatMap(
      //   physicalMIDIDeviceButtonModelToUIButtonMappingService.currentMap,
      //   updatePressedByMIDIPadButtons,
      // )
      physicalKeyboardButtonModelToAccordMappingService.mapChanges
      physicalKeyboardButtonModelToPatternMappingService.mapChanges
      physicalMIDIDeviceButtonModelToAccordMappingService.mapChanges
      physicalMIDIDeviceButtonModelToPatternMappingService.mapChanges

      const getPressureReportOfAccord =
        getPressureReportOfMapRef(accordButtonsMapRef)

      const getPressureReportOfPattern =
        getPressureReportOfMapRef(patternButtonsMapRef)

      const isPatternButtonPressed = isButtonPressed(getPressureReportOfPattern)
      const isAccordButtonPressed = isButtonPressed(getPressureReportOfAccord)

      // yield* reactivelySchedule(
      //   physicalKeyboardButtonModelMappingService.mapChanges,
      //   updatePressedByKeyboardKeys,
      // )

      // yield* reactivelySchedule(
      //   physicalMIDIDeviceButtonModelMappingService.mapChanges,
      //   updatePressedByMIDIPadButtons,
      // )

      yield* reactivelySchedule(
        accordRegistry.activeAccordChanges,
        activeAccord =>
          Effect.gen(function* () {
            for (const [accord] of yield* accordButtonsMapRef) {
              yield* transformReportGeneric('isActive', () =>
                Equal.equals(accord, activeAccord),
              )(accord, accordButtonsMapRef)
            }
          }),
      )

      yield* reactivelySchedule(
        patternRegistry.activePatternChanges,
        Effect.fn(function* (activePattern) {
          for (const [pattern] of yield* patternButtonsMapRef)
            yield* transformReportGeneric('isActive', () =>
              Equal.equals(pattern, activePattern),
            )(pattern, patternButtonsMapRef)
        }),
      )

      return {
        isPlayStopButtonPressable,
        getPressureReportOfAccord,
        getPressureReportOfPattern,
        isAccordButtonPressable,
        isPatternButtonPressable,
        isStrengthButtonPressable,
        isPatternButtonPressed,
        isAccordButtonPressed,
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
