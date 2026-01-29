import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Record from 'effect/Record'
import * as SortedMap from 'effect/SortedMap'
import * as SortedSet from 'effect/SortedSet'

import { ButtonState } from '../branded/index.ts'
import { type NoteId, NoteIdOrder } from '../branded/MIDIValues.ts'
// import type { StoreValues } from '../branded/index.ts'
import {
  RegisteredButtonID,
  RegisteredButtonIdOrder,
  type ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import { Accord, AccordOrderById, AccordRegistry } from './AccordRegistry.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import {
  Pattern,
  PatternOrderByIndex,
  PatternRegistry,
} from './PatternRegistry.ts'
import { PhysicalKeyboardKeyToUIButtonMappingService } from './PhysicalKeyboardKeyToUIButtonMappingService.ts'
import { PhysicalMIDIDeviceNoteToUIButtonMappingService } from './PhysicalMIDIDeviceNoteToUIButtonMappingService.ts'

export class UIButtonService extends Effect.Service<UIButtonService>()(
  'next-midi-demo/UIButtonService',
  {
    accessors: true,
    dependencies: [
      PatternRegistry.Default,
      AccordRegistry.Default,
      PhysicalKeyboardKeyToUIButtonMappingService.Default,
      PhysicalMIDIDeviceNoteToUIButtonMappingService.Default,
      CurrentlySelectedAssetState.Default,
      LoadedAssetSizeEstimationMap.Default,
    ],
    effect: Effect.gen(function* () {
      const accordRegistry = yield* AccordRegistry
      const patternRegistry = yield* PatternRegistry
      const currentlySelectedAssetState = yield* CurrentlySelectedAssetState
      const loadedAssetSizeEstimationMap = yield* LoadedAssetSizeEstimationMap
      const physicalKeyboardKeyToUIButtonMappingService =
        yield* PhysicalKeyboardKeyToUIButtonMappingService
      const physicalMIDIDeviceNoteToUIButtonMappingService =
        yield* PhysicalMIDIDeviceNoteToUIButtonMappingService

      const accordButtonIds = Effect.map(
        accordRegistry.allAccords,
        EArray.map(({ id }) => RegisteredButtonID(`accord-button-${id}`)),
      )

      const patternButtonIds = Effect.map(
        patternRegistry.allPatterns,
        EArray.map(({ index }) =>
          RegisteredButtonID(`pattern-button-${index}`),
        ),
      )

      let accordButtons = SortedMap.empty<Accord, PressureReport>(
        AccordOrderById,
      )

      let patternButtons = SortedMap.empty<Pattern, PressureReport>(
        PatternOrderByIndex,
      )

      const getOrDefault = (self: Option.Option<PressureReport>) =>
        EFunction.pipe(
          self,
          Option.orElseSome(
            (): PressureReport => ({
              pressedByKeyboardKeys: SortedSet.empty(ValidKeyboardKeyOrder),
              pressedByMIDIPadButtons: SortedSet.empty(NoteIdOrder),
            }),
          ),
          Option.getOrThrow,
        )

      const getPressureReportOf =
        <Assignee>(
          assigneeMap: SortedMap.SortedMap<Assignee, PressureReport>,
        ) =>
        (assignee: Assignee) =>
          getOrDefault(SortedMap.get(assigneeMap, assignee))

      const getUpdatedReport =
        <const K extends keyof PressureReport>(key: K) =>
        <Assignee>(
          assigneeMap: SortedMap.SortedMap<Assignee, PressureReport>,
        ) =>
        (assignee: Assignee) =>
        (
          pressState: ButtonState.AllSimple,
          pressTarget: PressureReport[K] extends SortedSet.SortedSet<infer V>
            ? V
            : never,
        ) => {
          const previousReport = getPressureReportOf(assigneeMap)(assignee)
          return {
            ...previousReport,
            [key]:
              pressState === ButtonState.Pressed
                ? SortedSet.add(previousReport[key] as any, pressTarget)
                : SortedSet.remove(previousReport[key] as any, pressTarget),
          }
        }

      for (const [
        keyboardKey,
        assignedKeyboardKeyInfo,
      ] of yield* physicalKeyboardKeyToUIButtonMappingService.currentMap) {
        const assignee = assignedKeyboardKeyInfo.assignedTo
        if (Pattern.models(assignee)) {
          patternButtons = SortedMap.set(
            patternButtons,
            assignee,
            getUpdatedReport('pressedByKeyboardKeys')(patternButtons)(assignee)(
              assignedKeyboardKeyInfo.keyboardKeyPressState,
              keyboardKey,
            ),
          )
        }

        if (Accord.models(assignee)) {
          accordButtons = SortedMap.set(
            accordButtons,
            assignee,
            getUpdatedReport('pressedByKeyboardKeys')(accordButtons)(assignee)(
              assignedKeyboardKeyInfo.keyboardKeyPressState,
              keyboardKey,
            ),
          )
        }
      }

      for (const [
        physicalMIDIDeviceNote,
        assignedMIDIDeviceNote,
      ] of yield* physicalMIDIDeviceNoteToUIButtonMappingService.currentMap) {
        const assignee = assignedMIDIDeviceNote.assignedTo
        if (Pattern.models(assignee)) {
          patternButtons = SortedMap.set(
            patternButtons,
            assignee,
            getUpdatedReport('pressedByMIDIPadButtons')(patternButtons)(
              assignee,
            )(assignedMIDIDeviceNote.notePressState, physicalMIDIDeviceNote),
          )
        }

        if (Accord.models(assignee)) {
          accordButtons = SortedMap.set(
            accordButtons,
            assignee,
            getUpdatedReport('pressedByMIDIPadButtons')(accordButtons)(
              assignee,
            )(assignedMIDIDeviceNote.notePressState, physicalMIDIDeviceNote),
          )
        }
      }

      const getPressureReportOfAccord = getPressureReportOf(accordButtons)
      const getPressureReportOfPattern = getPressureReportOf(patternButtons)

      const isButtonPressed =
        <Assignee>(getReport: (assignee: Assignee) => PressureReport) =>
        (assignee: Assignee) => {
          const report = getReport(assignee)
          return (
            !!SortedSet.size(report.pressedByKeyboardKeys) ||
            !!SortedSet.size(report.pressedByMIDIPadButtons)
          )
        }
      const isPatternButtonPressed = isButtonPressed(getPressureReportOfPattern)
      const isAccordButtonPressed = isButtonPressed(getPressureReportOfAccord)

      // console.log(
      //   'virtualMIDIPadButtonsWithActivations: ',
      //   EFunction.pipe(
      //     Record.fromEntries(
      //       SortedMap.entries(virtualMIDIPadButtonsWithActivations),
      //     ),
      //     Record.map(val => ({
      //       pressedByKeyboardKeys: [
      //         ...SortedSet.values(val.pressedByKeyboardKeys),
      //       ],
      //       pressedByMIDIPadButtons: [
      //         ...SortedSet.values(val.pressedByMIDIPadButtons),
      //       ],
      //     })),
      //   ),
      // )

      return {
        accordButtonIds,
        patternButtonIds,
        getPressureReportOfAccord,
        getPressureReportOfPattern,
        isPatternButtonPressed,
        isAccordButtonPressed,
      }
    }),
  },
) {}

export interface PressureReport {
  pressedByKeyboardKeys: SortedSet.SortedSet<ValidKeyboardKey>
  pressedByMIDIPadButtons: SortedSet.SortedSet<NoteId>
}
