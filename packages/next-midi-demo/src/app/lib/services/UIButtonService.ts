import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as SortedMap from 'effect/SortedMap'
import * as SortedSet from 'effect/SortedSet'

import { ButtonState } from '../branded/index.ts'
import { type NoteId, NoteIdOrder } from '../branded/MIDIValues.ts'
import {
  type ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import type { PhysicalButtonModel } from '../helpers/PhysicalButtonModel.ts'
import { reactivelySchedule } from '../helpers/reactiveFiberScheduler.ts'
import { sortedMapModify } from '../helpers/sortedMapModifyAt.ts'
import { Accord, AccordOrderById, AccordRegistry } from './AccordRegistry.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import {
  Pattern,
  PatternOrderByIndex,
  PatternRegistry,
} from './PatternRegistry.ts'
import { PhysicalKeyboardButtonModelToAccordMappingService } from './PhysicalKeyboardButtonModelToAccordMappingService.ts'
import { PhysicalKeyboardButtonModelToPatternMappingService } from './PhysicalKeyboardButtonModelToPatternMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToAccordMappingService } from './PhysicalMIDIDeviceButtonModelToAccordMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToPatternMappingService } from './PhysicalMIDIDeviceButtonModelToPatternMappingService.ts'

export class UIButtonService extends Effect.Service<UIButtonService>()(
  'next-midi-demo/UIButtonService',
  {
    accessors: true,
    dependencies: [
      PatternRegistry.Default,
      AccordRegistry.Default,
      PhysicalKeyboardButtonModelToAccordMappingService.Default,
      PhysicalKeyboardButtonModelToPatternMappingService.Default,
      PhysicalMIDIDeviceButtonModelToAccordMappingService.Default,
      PhysicalMIDIDeviceButtonModelToPatternMappingService.Default,
      LoadedAssetSizeEstimationMap.Default,
    ],
    scoped: Effect.gen(function* () {
      const accordRegistry = yield* AccordRegistry
      const patternRegistry = yield* PatternRegistry
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

      // TODO: в банальном варианте onDown событие ставит активную клавишу

      // TODO: блокировать нажатия кнопок на ранних стадиях. Нажатие на кнопку
      // паттерна/аккорда, как и её отпускание должны просто игнорироваться,
      // если по логике кнопка должна быть заблокирована

      // В момент активного плейбека может стать кандидатом на переключение только та кнопка паттерна аккорда

      const patternButtonsMapRef = yield* Ref.make<PatternButtonMap>(
        SortedMap.empty(PatternOrderByIndex),
      )

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
              if (Pattern.models(model.assignedTo))
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

      const getPressureReportOfAccord =
        getPressureReportOfMapRef(accordButtonsMapRef)

      const getPressureReportOfPattern =
        getPressureReportOfMapRef(patternButtonsMapRef)

      const isPatternButtonPressed = isButtonPressed(getPressureReportOfPattern)
      const isAccordButtonPressed = isButtonPressed(getPressureReportOfAccord)

      yield* reactivelySchedule(
        physicalKeyboardButtonModelMappingService.mapChanges,
        updatePressedByKeyboardKeys,
      )

      yield* reactivelySchedule(
        physicalMIDIDeviceButtonModelMappingService.mapChanges,
        updatePressedByMIDIPadButtons,
      )

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
        getPressureReportOfAccord,
        getPressureReportOfPattern,
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

interface PatternButtonMap extends PressureReportMap<Pattern> {}

interface PressureReportMap<Key>
  extends SortedMap.SortedMap<Key, PressureReport> {}

interface PressureReportMapRef<Key> extends Ref.Ref<PressureReportMap<Key>> {}
