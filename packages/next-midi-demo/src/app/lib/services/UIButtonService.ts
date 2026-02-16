import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
import { ButtonState } from '../branded/index.ts'
import type { NoteId, NoteIdData } from '../branded/MIDIValues.ts'
import type {
  ValidKeyboardKey,
  ValidKeyboardKeyData,
} from '../branded/StoreValues.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'
import { streamAll } from '../helpers/streamAll.ts'
import {
  type AccordIndexData,
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
  PatternRegistry,
} from './PatternRegistry.ts'
import { PhysicalKeyboardButtonModelToAccordMappingService } from './PhysicalKeyboardButtonModelToAccordMappingService.ts'
import { PhysicalKeyboardButtonModelToPatternMappingService } from './PhysicalKeyboardButtonModelToPatternMappingService.ts'
import { PhysicalKeyboardButtonModelToStrengthMappingService } from './PhysicalKeyboardButtonModelToStrengthMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToAccordMappingService } from './PhysicalMIDIDeviceButtonModelToAccordMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToPatternMappingService } from './PhysicalMIDIDeviceButtonModelToPatternMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToStrengthMappingService } from './PhysicalMIDIDeviceButtonModelToStrengthMappingService.ts'
import { type StrengthData, StrengthRegistry } from './StrengthRegistry.ts'
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
      yield* LoadedAssetSizeEstimationMap
      yield* AssetDownloadScheduler
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

      // TODO: нужно сделать чтобы визуально прожимались только те, которые
      // могут визуально прожиматься на текущий момент

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
          Stream.rechunk(1),
        )

      const getIsSelectedAccordStream = (accord: AllAccordUnion) =>
        accordRegistry.selectedAccordChanges.pipe(
          Stream.map(Equal.equals(accord)),
          Stream.changes,
          Stream.rechunk(1),
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
          Stream.rechunk(1),
          Stream.tap(isSelected =>
            Effect.log(
              `Pattern index=${pattern.index} is ${isSelected ? '' : 'not '}selected`,
            ),
          ),
        )

      const getIsSelectedStrengthStream = (strength: Strength) =>
        strengthRegistry.selectedStrengthChanges.pipe(
          Stream.map(Equal.equals(strength)),
          Stream.changes,
          Stream.rechunk(1),
          Stream.tap(isSelected =>
            Effect.log(
              `Strength=${strength} is ${isSelected ? '' : 'not '}selected`,
            ),
          ),
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
              pb.currentAsset.accord.index === accord.index,
          ),
          Stream.changes,
          Stream.rechunk(1),
          Stream.tap(a =>
            Effect.log(
              `Accord index=${accord.index} button is ${a ? '' : 'not '}pressable`,
            ),
          ),
        )
      const isPatternButtonCurrentlyPlaying = (pattern: AllPatternUnion) =>
        appPlaybackState.playbackPublicInfoChangesStream.pipe(
          Stream.map(
            pb =>
              pb._tag !== 'NotPlaying' &&
              Equal.equals(pb.currentAsset.pattern, pattern),
          ),
          Stream.changes,
          Stream.rechunk(1),
          Stream.tap(a =>
            Effect.log(
              `Pattern index=${pattern.index} button is ${a ? '' : 'not '}pressable`,
            ),
          ),
        )
      const isStrengthButtonCurrentlyPlaying = (strength: Strength) =>
        appPlaybackState.playbackPublicInfoChangesStream.pipe(
          Stream.map(
            pb =>
              pb._tag !== 'NotPlaying' && pb.currentAsset.strength === strength,
          ),
          Stream.changes,
          Stream.rechunk(1),
          Stream.tap(a =>
            Effect.log(
              `Strength=${strength} button is ${a ? '' : 'not '}pressable`,
            ),
          ),
        )

      // Currently selected asset is always the asset that will be played next

      const getAccordButtonDownloadPercent = (accord: AllAccordUnion) =>
        currentlySelectedAssetState
          .getPatchedAssetFetchingCompletionStatusChangesStream(accord)
          .pipe(
            Stream.map(s =>
              s.status === 'not finished'
                ? Math.floor((s.currentBytes / ASSET_SIZE_BYTES) * 100)
                : s.status === 'almost finished: fetched, but not written'
                  ? 99
                  : 100,
            ),
            Stream.changes,
            Stream.rechunk(1),
            Stream.tap(percent =>
              Effect.log(
                `Accord index=${accord.index} download percent=${percent}`,
              ),
            ),
          )

      const getPatternButtonDownloadPercent = (pattern: AllPatternUnion) =>
        currentlySelectedAssetState
          .getPatchedAssetFetchingCompletionStatusChangesStream(pattern)
          .pipe(
            Stream.map(s =>
              s.status === 'not finished'
                ? Math.floor((s.currentBytes / ASSET_SIZE_BYTES) * 100)
                : s.status === 'almost finished: fetched, but not written'
                  ? 99
                  : 100,
            ),
            Stream.changes,
            Stream.rechunk(1),
            Stream.tap(percent =>
              Effect.log(
                `Pattern index=${pattern.index} download percent=${percent}`,
              ),
            ),
          )

      const getStrengthButtonDownloadPercent = (strength: Strength) =>
        currentlySelectedAssetState
          .getPatchedAssetFetchingCompletionStatusChangesStream(strength)
          .pipe(
            Stream.map(s =>
              s.status === 'not finished'
                ? Math.floor((s.currentBytes / ASSET_SIZE_BYTES) * 100)
                : s.status === 'almost finished: fetched, but not written'
                  ? 99
                  : 100,
            ),
            Stream.changes,
            Stream.rechunk(1),
            Stream.tap(percent =>
              Effect.log(`Strength=${strength} download percent=${percent}`),
            ),
          )

      const getMapCombinerStream =
        <T>() =>
        <E, R>(
          self: Stream.Stream<
            SupportedKeyData extends infer Key
              ? Key extends any
                ? HashMap.HashMap<Key, PhysicalButtonModel<T>>
                : never
              : never,
            E,
            R
          >,
        ) =>
          Stream.scan(
            self,
            HashMap.empty<T, HashSet.HashSet<SupportedKeyData>>(),
            (previousMap, latestMap) => {
              let newMap = previousMap
              for (const [physicalButtonId, physicalButtonModel] of latestMap)
                newMap = HashMap.modifyAt(
                  newMap,
                  physicalButtonModel.assignedTo,
                  EFunction.flow(
                    Option.orElseSome(() => HashSet.empty()),
                    Option.map(setOfPhysicalIdsTheButtonIsPressedBy =>
                      (physicalButtonModel.buttonPressState ===
                        ButtonState.Pressed
                        ? HashSet.add
                        : HashSet.remove)(
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
          Stream.rechunk(1),
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
        Effect.tapErrorCause(Effect.logError),
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
        Effect.tapErrorCause(Effect.logError),
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
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      const isAccordButtonPressedFlagChangesStream = (accord: AllAccordUnion) =>
        AccordPressAggregateStream.pipe(
          Stream.map(
            EFunction.flow(
              HashMap.get(accord),
              Option.map(set => HashSet.size(set) !== 0),
              Option.getOrElse(() => false),
            ),
          ),
          Stream.changes,
          Stream.rechunk(1),
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
          Stream.rechunk(1),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      const isPatternButtonPressedFlagChangesStream = (
        pattern: AllPatternUnion,
      ) =>
        PatternPressAggregateStream.pipe(
          Stream.map(
            EFunction.flow(
              HashMap.get(pattern),
              Option.map(set => HashSet.size(set) !== 0),
              Option.getOrElse(() => false),
            ),
          ),
          Stream.changes,
          Stream.rechunk(1),
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
          Stream.rechunk(1),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      const isStrengthButtonPressedFlagChangesStream = (strength: Strength) =>
        StrengthPressAggregateStream.pipe(
          Stream.map(
            EFunction.flow(
              HashMap.get(strength),
              Option.map(set => HashSet.size(set) !== 0),
              Option.getOrElse(() => false),
            ),
          ),
          Stream.changes,
          Stream.rechunk(1),
          Stream.tap(isPressed =>
            Effect.log(
              `strength=${strength} is ${isPressed ? '' : 'not '}pressed`,
            ),
          ),
        )

      return {
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

export interface PressureReport {
  isActive: boolean
  pressedByKeyboardKeys: HashSet.HashSet<ValidKeyboardKey>
  pressedByMIDIPadButtons: HashSet.HashSet<NoteId>
}

interface ButtonPressabilityDecisionRequirements {
  readonly isPlaying: boolean
  readonly completionStatusOfTheAssetThisButtonWouldSelect: AssetCompletionStatus
  readonly isSelectedParam: boolean
}

type SupportedKeyData =
  | ValidKeyboardKeyData
  | NoteIdData
  | AccordIndexData
  | StrengthData
  | PatternIndexData
