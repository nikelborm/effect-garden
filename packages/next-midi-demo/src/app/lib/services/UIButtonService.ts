import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as SortedMap from 'effect/SortedMap'
import * as SortedSet from 'effect/SortedSet'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../branded/index.ts'
import { type NoteId, NoteIdOrder } from '../branded/MIDIValues.ts'
import {
  type ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import type { PhysicalButtonModel } from '../helpers/PhysicalButtonModel.ts'
import { sortedMapModify } from '../helpers/sortedMapModifyAt.ts'
import { Accord, AccordOrderById, AccordRegistry } from './AccordRegistry.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import {
  Pattern,
  PatternOrderByIndex,
  PatternRegistry,
} from './PatternRegistry.ts'
import { PhysicalKeyboardKeyModelToUIButtonMappingService } from './PhysicalKeyboardKeyModelToUIButtonMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToUIButtonMappingService } from './PhysicalMIDIDeviceButtonModelToUIButtonMappingService.ts'

export class UIButtonService extends Effect.Service<UIButtonService>()(
  'next-midi-demo/UIButtonService',
  {
    accessors: true,
    dependencies: [
      PatternRegistry.Default,
      AccordRegistry.Default,
      PhysicalKeyboardKeyModelToUIButtonMappingService.Default,
      PhysicalMIDIDeviceButtonModelToUIButtonMappingService.Default,
      CurrentlySelectedAssetState.Default,
      LoadedAssetSizeEstimationMap.Default,
    ],
    scoped: Effect.gen(function* () {
      const accordRegistry = yield* AccordRegistry
      const patternRegistry = yield* PatternRegistry
      const currentlySelectedAssetState = yield* CurrentlySelectedAssetState
      const loadedAssetSizeEstimationMap = yield* LoadedAssetSizeEstimationMap
      const physicalKeyboardKeyModelToUIButtonMappingService =
        yield* PhysicalKeyboardKeyModelToUIButtonMappingService
      const physicalMIDIDeviceButtonModelToUIButtonMappingService =
        yield* PhysicalMIDIDeviceButtonModelToUIButtonMappingService

      const accordButtonsMapRef = yield* Ref.make<AccordButtonMap>(
        SortedMap.empty(AccordOrderById),
      )

      const patternButtonsMapRef = yield* Ref.make<PatternButtonMap>(
        SortedMap.empty(PatternOrderByIndex),
      )

      const shit =
        <const TReportKey extends keyof PressureReport>(key: TReportKey) =>
        (
          map: SortedMap.SortedMap<
            PressureReport[TReportKey] extends SortedSet.SortedSet<infer V>
              ? V
              : never,
            PhysicalButtonModel
          >,
        ) =>
          Effect.forEach(
            map,
            ([id, model]) =>
              Effect.gen(function* () {
                const transformReport = <TAssignee>(
                  self: PressureReportMapRef<TAssignee>,
                  assignee: TAssignee,
                ) =>
                  Ref.update(
                    self,
                    sortedMapModify(
                      assignee,
                      (previousReport: PressureReport): PressureReport => ({
                        ...previousReport,
                        [key]:
                          model.buttonPressState === ButtonState.Pressed
                            ? SortedSet.add(previousReport[key] as any, id)
                            : SortedSet.remove(previousReport[key] as any, id),
                      }),
                    ),
                  )

                if (Pattern.models(model.assignedTo))
                  yield* transformReport(patternButtonsMapRef, model.assignedTo)

                if (Accord.models(model.assignedTo))
                  yield* transformReport(accordButtonsMapRef, model.assignedTo)
              }),
            { discard: true },
          )

      const updatePressedByKeyboardKeys = shit('pressedByKeyboardKeys')
      const updatePressedByMIDIPadButtons = shit('pressedByMIDIPadButtons')

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

      yield* EFunction.pipe(
        physicalKeyboardKeyModelToUIButtonMappingService.mapChanges,
        Stream.tap(updatePressedByKeyboardKeys),
        Stream.runDrain,
        Effect.forkScoped,
      )

      yield* EFunction.pipe(
        physicalMIDIDeviceButtonModelToUIButtonMappingService.mapChanges,
        Stream.tap(updatePressedByMIDIPadButtons),
        Stream.runDrain,
        Effect.forkScoped,
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
    Effect.map(Ref.get(assigneeMapRef), getPressureReportOfMap(assignee))

const getPressureReportOfMap = <TAssignee>(assignee: TAssignee) =>
  EFunction.flow(SortedMap.get(assignee)<PressureReport>, defaultReportOnNone)

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
