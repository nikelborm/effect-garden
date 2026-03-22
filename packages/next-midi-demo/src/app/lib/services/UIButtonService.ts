import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
import type { NoteId } from '../branded/MIDIValues.ts'
import type { ValidKeyboardKey } from '../branded/StoreValues.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'
import { streamAll } from '../helpers/streamAll.ts'
import { AccordRegistry, type AllAccordUnion } from './AccordRegistry.ts'
import { AppPlaybackStateService } from './AppPlaybackStateService.ts'
import { AssetDownloadScheduler } from './AssetDownloadScheduler.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import {
  AccordInputBus,
  PatternInputBus,
  StrengthInputBus,
} from './InputStreamBus.ts'
import {
  type AssetCompletionStatus,
  LoadedAssetSizeEstimationMap,
} from './LoadedAssetSizeEstimationMap.ts'
import type { PhysicalButtonModel } from './makePhysicalButtonToParamMappingService.ts'
import { type AllPatternUnion, PatternRegistry } from './PatternRegistry.ts'
import type { Patch } from './CurrentlySelectedAssetState.ts'
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
      yield* LoadedAssetSizeEstimationMap
      yield* AssetDownloadScheduler
      const accordBus = yield* AccordInputBus
      const patternBus = yield* PatternInputBus
      const strengthBus = yield* StrengthInputBus

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

      const makeIsSelectedStream = <A, E, R>(
        source: Stream.Stream<A, E, R>,
        value: A,
        label: string,
      ) =>
        source.pipe(
          Stream.map(Equal.equals(value)),
          Stream.changes,
          Stream.rechunk(1),
          Stream.tap(isSelected =>
            Effect.log(`${label} is ${isSelected ? '' : 'not '}selected`),
          ),
        )

      const getIsSelectedAccordStream = (accord: AllAccordUnion) =>
        makeIsSelectedStream(
          accordRegistry.selectedAccordChanges,
          accord,
          `Accord index=${accord.index}`,
        )

      const getIsSelectedPatternStream = (pattern: AllPatternUnion) =>
        makeIsSelectedStream(
          patternRegistry.selectedPatternChanges,
          Option.some(pattern),
          `Pattern index=${pattern.index}`,
        )

      const getIsSelectedStrengthStream = (strength: Strength) =>
        makeIsSelectedStream(
          strengthRegistry.selectedStrengthChanges,
          strength,
          `Strength=${strength}`,
        )

      const makePressabilityChangesStream = <E, R>(
        patch: Patch,
        isSelectedStream: Stream.Stream<boolean, E, R>,
      ) =>
        streamAll({
          isPlaying: appPlaybackState.latestIsPlayingFlagStream,
          completionStatusOfTheAssetThisButtonWouldSelect:
            currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
              patch,
            ),
          isSelectedParam: isSelectedStream,
        }).pipe(isPressable)

      const getAccordButtonPressabilityChangesStream = (accord: AllAccordUnion) =>
        makePressabilityChangesStream(accord, getIsSelectedAccordStream(accord))

      const getPatternButtonPressabilityChangesStream = (
        pattern: AllPatternUnion,
      ) =>
        makePressabilityChangesStream(pattern, getIsSelectedPatternStream(pattern))

      const getStrengthButtonPressabilityChangesStream = (strength: Strength) =>
        makePressabilityChangesStream(strength, getIsSelectedStrengthStream(strength))

      const makeIsCurrentlyPlayingStream = (
        predicate: (
          pb: Exclude<
            Stream.Stream.Success<
              typeof appPlaybackState.playbackPublicInfoChangesStream
            >,
            { _tag: 'NotPlaying' }
          >,
        ) => boolean,
        label: string,
      ) =>
        appPlaybackState.playbackPublicInfoChangesStream.pipe(
          Stream.map(pb => pb._tag !== 'NotPlaying' && predicate(pb)),
          Stream.changes,
          Stream.rechunk(1),
          Stream.tap(a =>
            Effect.log(`${label} button is ${a ? '' : 'not '}pressable`),
          ),
        )

      const isAccordButtonCurrentlyPlaying = (accord: AllAccordUnion) =>
        makeIsCurrentlyPlayingStream(
          pb => pb.currentAsset.accord.index === accord.index,
          `Accord index=${accord.index}`,
        )

      const isPatternButtonCurrentlyPlaying = (pattern: AllPatternUnion) =>
        makeIsCurrentlyPlayingStream(
          pb => Equal.equals(pb.currentAsset.pattern, Option.some(pattern)),
          `Pattern index=${pattern.index}`,
        )

      const isStrengthButtonCurrentlyPlaying = (strength: Strength) =>
        makeIsCurrentlyPlayingStream(
          pb => pb.currentAsset.strength === strength,
          `Strength=${strength}`,
        )

      // Currently selected asset is always the asset that will be played next

      const makeDownloadPercentStream = (patch: Patch, label: string) =>
        currentlySelectedAssetState
          .getPatchedAssetFetchingCompletionStatusChangesStream(patch)
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
              Effect.log(`${label} download percent=${percent}`),
            ),
          )

      const getAccordButtonDownloadPercent = (accord: AllAccordUnion) =>
        makeDownloadPercentStream(accord, `Accord index=${accord.index}`)

      const getPatternButtonDownloadPercent = (pattern: AllPatternUnion) =>
        makeDownloadPercentStream(pattern, `Pattern index=${pattern.index}`)

      const getStrengthButtonDownloadPercent = (strength: Strength) =>
        makeDownloadPercentStream(strength, `Strength=${strength}`)

      yield* accordBus.forEachPress(
        Effect.fn(function* (assignedTo) {
          const isAccordButtonPressable = yield* EFunction.pipe(
            getAccordButtonPressabilityChangesStream(assignedTo),
            Stream.take(1),
            Stream.runHead,
            Effect.map(Option.getOrThrow),
          )
          if (isAccordButtonPressable)
            yield* accordRegistry.selectAccord(assignedTo.index)
        }),
      )

      yield* patternBus.forEachPress(
        Effect.fn(function* (assignedTo) {
          const isPatternButtonPressable = yield* EFunction.pipe(
            getPatternButtonPressabilityChangesStream(assignedTo),
            Stream.take(1),
            Stream.runHead,
            Effect.map(Option.getOrThrow),
          )
          if (isPatternButtonPressable)
            yield* patternRegistry.selectPattern(assignedTo.index)
        }),
      )

      yield* strengthBus.forEachPress(
        Effect.fn(function* (assignedTo) {
          const isStrengthButtonPressable = yield* EFunction.pipe(
            getStrengthButtonPressabilityChangesStream(assignedTo),
            Stream.take(1),
            Stream.runHead,
            Effect.map(Option.getOrThrow),
          )
          if (isStrengthButtonPressable)
            yield* strengthRegistry.selectStrength(assignedTo)
        }),
      )

      const isAccordButtonPressedFlagChangesStream = (accord: AllAccordUnion) =>
        accordBus.isPressedStream(accord)

      const isPatternButtonPressedFlagChangesStream = (
        pattern: AllPatternUnion,
      ) => patternBus.isPressedStream(pattern)

      const isStrengthButtonPressedFlagChangesStream = (strength: Strength) =>
        strengthBus.isPressedStream(strength)

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
