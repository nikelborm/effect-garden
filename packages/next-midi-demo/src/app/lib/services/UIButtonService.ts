import type * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import type * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
import type { NoteId } from '../branded/MIDIValues.ts'
import type { ValidKeyboardKey } from '../branded/StoreValues.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'
import { streamAll } from '../helpers/streamAll.ts'
import { AccordRegistry, type AllAccordUnion } from './AccordRegistry.ts'
import { AppPlaybackStateService } from './AppPlaybackStateService.ts'
import {
  CurrentlySelectedAssetState,
  type CurrentSelectedAsset,
  type Patch,
} from './CurrentlySelectedAssetState.ts'
import {
  AccordInputBus,
  PatternInputBus,
  StrengthInputBus,
} from './InputStreamBus.ts'
import { type AllPatternUnion, PatternRegistry } from './PatternRegistry.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

interface InputBusHandle<T> {
  readonly isPressedStream: (key: T) => Stream.Stream<boolean>
  readonly forEachPress: (
    handler: (assignedTo: T) => Effect.Effect<void>,
  ) => Effect.Effect<any, any, any>
}

const makeUIButtonEntityService = <T extends Patch, S, Reg>({
  registryTag,
  busTag,
  getSelectedChangesStream,
  toCompareValue,
  toLabel,
  isCurrentlyPlayingPredicate,
  selectAction,
}: {
  readonly registryTag: Context.ReadonlyTag<any, Reg>
  readonly busTag: Context.ReadonlyTag<any, InputBusHandle<T>>
  readonly getSelectedChangesStream: (registry: Reg) => Stream.Stream<S>
  readonly toCompareValue: (value: T) => S
  readonly toLabel: (value: T) => string
  readonly isCurrentlyPlayingPredicate: (
    pb: { currentAsset: CurrentSelectedAsset },
    value: T,
  ) => boolean
  readonly selectAction: (registry: Reg, value: T) => Effect.Effect<void>
}) =>
  Effect.gen(function* () {
    const [appPlaybackState, currentlySelectedAssetState, registry, bus] =
      yield* Effect.all(
        [
          AppPlaybackStateService,
          CurrentlySelectedAssetState,
          registryTag,
          busTag,
        ],
        { concurrency: 'unbounded' },
      )

    const selectedChangesStream = getSelectedChangesStream(registry)

    const getIsSelectedStream = (value: T) =>
      selectedChangesStream.pipe(
        Stream.map(Equal.equals(toCompareValue(value))),
        Stream.changes,
        Stream.rechunk(1),
        Stream.tap(isSelected =>
          Effect.log(
            `${toLabel(value)} is ${isSelected ? '' : 'not '}selected`,
          ),
        ),
      )

    const getPressabilityChangesStream = (value: T) =>
      streamAll({
        isPlaying: appPlaybackState.latestIsPlayingFlagStream,
        completionStatusOfTheAssetThisButtonWouldSelect:
          currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
            value,
          ),
        isSelectedParam: getIsSelectedStream(value),
      }).pipe(
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

    const isCurrentlyPlaying = (value: T) =>
      appPlaybackState.playbackPublicInfoChangesStream.pipe(
        Stream.map(
          pb =>
            pb._tag !== 'NotPlaying' && isCurrentlyPlayingPredicate(pb, value),
        ),
        Stream.changes,
        Stream.rechunk(1),
        Stream.tap(a =>
          Effect.log(`${toLabel(value)} button is ${a ? '' : 'not '}playing`),
        ),
      )

    const getDownloadPercent = (value: T) =>
      currentlySelectedAssetState
        .getPatchedAssetFetchingCompletionStatusChangesStream(value)
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
            Effect.log(`${toLabel(value)} download percent=${percent}`),
          ),
        )

    yield* bus.forEachPress(
      Effect.fn(function* (value) {
        const isPressableNow = yield* EFunction.pipe(
          getPressabilityChangesStream(value),
          Stream.take(1),
          Stream.runHead,
          Effect.map(Option.getOrThrow),
        )
        if (isPressableNow) yield* selectAction(registry, value)
      }),
    )

    return {
      getIsSelectedStream,
      getPressabilityChangesStream,
      isCurrentlyPlaying,
      getDownloadPercent,
      isPressedFlagChangesStream: (value: T) => bus.isPressedStream(value),
    }
  })

export class AccordUIButtonService extends Effect.Service<AccordUIButtonService>()(
  'next-midi-demo/AccordUIButtonService',
  {
    accessors: true,
    scoped: makeUIButtonEntityService({
      registryTag: AccordRegistry,
      busTag: AccordInputBus,
      getSelectedChangesStream: reg => reg.selectedAccordChanges,
      toCompareValue: EFunction.identity<AllAccordUnion>,
      toLabel: accord => `Accord index=${accord.index}`,
      isCurrentlyPlayingPredicate: (pb, accord) =>
        pb.currentAsset.accord.index === accord.index,
      selectAction: (reg, accord) => reg.selectAccord(accord.index),
    }),
  },
) {}

export class PatternUIButtonService extends Effect.Service<PatternUIButtonService>()(
  'next-midi-demo/PatternUIButtonService',
  {
    accessors: true,
    scoped: makeUIButtonEntityService({
      registryTag: PatternRegistry,
      busTag: PatternInputBus,
      getSelectedChangesStream: reg => reg.selectedPatternChanges,
      toCompareValue: Option.some<AllPatternUnion>,
      toLabel: pattern => `Pattern index=${pattern.index}`,
      isCurrentlyPlayingPredicate: (pb, pattern) =>
        Equal.equals(pb.currentAsset.pattern, Option.some(pattern)),
      selectAction: (reg, pattern) => reg.selectPattern(pattern.index),
    }),
  },
) {}

export class StrengthUIButtonService extends Effect.Service<StrengthUIButtonService>()(
  'next-midi-demo/StrengthUIButtonService',
  {
    accessors: true,
    scoped: makeUIButtonEntityService({
      registryTag: StrengthRegistry,
      busTag: StrengthInputBus,
      getSelectedChangesStream: reg => reg.selectedStrengthChanges,
      toCompareValue: EFunction.identity<Strength>,
      toLabel: strength => `Strength=${strength}`,
      isCurrentlyPlayingPredicate: (pb, strength) =>
        pb.currentAsset.strength === strength,
      selectAction: (reg, strength) => reg.selectStrength(strength),
    }),
  },
) {}
