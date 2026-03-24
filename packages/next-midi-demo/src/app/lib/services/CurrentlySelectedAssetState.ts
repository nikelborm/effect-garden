import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import {
  type AssetPointer,
  type Strength,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../audioAssetHelpers.ts'
import { streamAll } from '../helpers/streamAll.ts'
import {
  Accord,
  AccordRegistry,
  type AllAccordUnion,
} from './AccordRegistry.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import {
  type AllPatternUnion,
  Pattern,
  PatternRegistry,
} from './PatternRegistry.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

export class CurrentlySelectedAssetState extends Effect.Service<CurrentlySelectedAssetState>()(
  'next-midi-demo/CurrentlySelectedAssetState',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const accordRegistry = yield* AccordRegistry
      const patternRegistry = yield* PatternRegistry
      const strengthRegistry = yield* StrengthRegistry
      const estimationMap = yield* LoadedAssetSizeEstimationMap

      const currentEffect = Effect.all({
        accord: accordRegistry.currentlySelectedAccord,
        pattern: patternRegistry.currentlySelectedPattern,
        strength: strengthRegistry.currentlySelectedStrength,
      }).pipe(Effect.map(complexifyAssetPointer))

      const selectedAssetChangesStream = yield* streamAll({
        strength: strengthRegistry.selectedStrengthChanges,
        accord: accordRegistry.selectedAccordChanges,
        pattern: patternRegistry.selectedPatternChanges,
      }).pipe(
        Stream.map(complexifyAssetPointer),
        Stream.tap(selectedAsset =>
          Effect.log('Selected asset stream value: ', selectedAsset),
        ),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      const completionStatus = Effect.flatMap(
        currentEffect,
        estimationMap.getAssetFetchingCompletionStatus,
      )

      const completionStatusChangesStream =
        yield* selectedAssetChangesStream.pipe(
          Stream.flatMap(
            estimationMap.getAssetFetchingCompletionStatusChangesStream,
            { switch: true, concurrency: 1 },
          ),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      const isFinishedDownloadCompletely = Effect.map(
        completionStatus,
        ({ status }) => status === 'finished',
      )

      const isFinishedDownloadCompletelyFlagChangesStream =
        yield* completionStatusChangesStream.pipe(
          Stream.map(({ status }) => status === 'finished'),
          Stream.changes,
          Stream.rechunk(1),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      const getPatchedAssetFetchingCompletionStatusChangesStream = (
        patch: Patch,
      ) => {
        const applyPatch = makePatchApplier(patch)
        return Stream.flatMap(
          selectedAssetChangesStream,
          EFunction.flow(
            applyPatch,
            estimationMap.getAssetFetchingCompletionStatusChangesStream,
          ),
          { switch: true, concurrency: 1 },
        )
      }

      return {
        current: currentEffect,
        isFinishedDownloadCompletely,
        isFinishedDownloadCompletelyFlagChangesStream,
        getPatchedAssetFetchingCompletionStatusChangesStream,
        changes: selectedAssetChangesStream,
      }
    }),
  },
) {}

export const complexifyAssetPointer = ({
  accord,
  pattern,
  strength,
}: CurrentSelectedAsset): AssetPointer =>
  Option.match(pattern, {
    onNone: () =>
      TaggedSlowStrumPointer.make({
        accordIndex: accord.index,
        strength,
      }),
    onSome: pattern =>
      TaggedPatternPointer.make({
        accordIndex: accord.index,
        patternIndex: pattern.index,
        strength,
      }),
  })

export const simplifyAssetPointer = (
  asset: AssetPointer,
): SimpleAssetPointer => ({
  accordIndex: asset.accordIndex,
  patternIndex: TaggedPatternPointer.models(asset)
    ? Option.some(asset.patternIndex)
    : Option.none(),
  strength: asset.strength,
})

export const desimplifyAssetPointer = ({
  patternIndex: patternIndexOption,
  ...other
}: SimpleAssetPointer) =>
  Option.match(patternIndexOption, {
    onNone: () => TaggedSlowStrumPointer.make(other),
    onSome: patternIndex =>
      TaggedPatternPointer.make({ ...other, patternIndex }),
  })

export interface SimpleAssetPointer {
  accordIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  patternIndex: Option.Option<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>
  strength: 'm' | 's' | 'v'
}

const makePatchApplier =
  (patch: Patch) =>
  (old: AssetPointer): AssetPointer => {
    if (Pattern.models(patch))
      return TaggedPatternPointer.make({ ...old, patternIndex: patch.index })

    if (Accord.models(patch)) {
      if (TaggedPatternPointer.models(old))
        return TaggedPatternPointer.make({ ...old, accordIndex: patch.index })

      return TaggedSlowStrumPointer.make({ ...old, accordIndex: patch.index })
    }

    if (TaggedPatternPointer.models(old))
      return TaggedPatternPointer.make({ ...old, strength: patch })

    return TaggedSlowStrumPointer.make({ ...old, strength: patch })
  }

export interface CurrentSelectedAsset {
  readonly strength: Strength
  readonly pattern: Option.Option<AllPatternUnion>
  readonly accord: AllAccordUnion
}

export type Patch = AllPatternUnion | AllAccordUnion | Strength
