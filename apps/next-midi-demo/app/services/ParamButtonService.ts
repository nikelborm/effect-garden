import type * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import {
  type AccordData,
  AccordParamButtonData,
} from '../brandsAndDatas/Accord.ts'
import type { ParamButtonIdData } from '../brandsAndDatas/ParamButton.ts'
import {
  type PatternData,
  PatternParamButtonData,
} from '../brandsAndDatas/Pattern.ts'
import {
  type StrengthData,
  StrengthParamButtonData,
} from '../brandsAndDatas/Strength.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'
import { streamAll } from '../helpers/streamAll.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { AppPlaybackStateService } from './AppPlaybackStateService/AppPlaybackStateService.ts'
import type { PlayingAppPlaybackStates } from './AppPlaybackStateService/types/index.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import {
  AccordInputBus,
  type InputBusReaderHandle,
  PatternInputBus,
  StrengthInputBus,
} from './InputStreamBus.ts'
import { PatternRegistry } from './PatternRegistry.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

const makeParamButtonService = <
  TParamButtonId extends PatternData | AccordData | StrengthData,
  S,
  TRegistryInstance,
  TRegistryId,
  TBusId,
>({
  registryTag,
  busTag,
  getSelectedChangesStream,
  toCompareValue,
  toLabel,
  // isCurrentlyPlayingPredicate,
  // selectAction,
}: {
  readonly registryTag: Context.ReadonlyTag<TRegistryId, TRegistryInstance>
  readonly busTag: Context.ReadonlyTag<
    TBusId,
    InputBusReaderHandle<TParamButtonId>
  >
  readonly getSelectedChangesStream: (
    registry: TRegistryInstance,
  ) => Stream.Stream<S>
  readonly toCompareValue: (value: ParamButtonIdData<TParamButtonId>) => S
  readonly toLabel: (value: ParamButtonIdData<TParamButtonId>) => string
  // readonly isCurrentlyPlayingPredicate: (
  //   pb: PlayingAppPlaybackStates,
  //   value: ParamButtonIdData<TParamButtonId>,
  // ) => boolean
  // readonly selectAction: (
  //   registry: Reg,
  //   value: ParamButtonIdData<TParamButtonId>,
  // ) => Effect.Effect<void>
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

    const getIsSelectedStream = (value: ParamButtonIdData<TParamButtonId>) =>
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

    // const getPressabilityChangesStream = (
    //   value: ParamButtonIdData<TParamButtonId>,
    // ) =>
    //   streamAll({
    //     isPlaying: appPlaybackState.latestIsPlayingFlagStream,
    //     completionStatusOfTheAssetThisButtonWouldSelect:
    //       currentlySelectedAssetState.getPatchedAssetFetchingCompletionStatusChangesStream(
    //         value.id,
    //       ),
    //     isSelectedParam: getIsSelectedStream(value),
    //   }).pipe(
    //     Stream.map(
    //       req =>
    //         !req.isSelectedParam &&
    //         (!req.isPlaying ||
    //           req.completionStatusOfTheAssetThisButtonWouldSelect.status ===
    //             'finished'),
    //     ),
    //     Stream.changes,
    //     Stream.rechunk(1),
    //   )

    // const isCurrentlyPlaying = (value: ParamButtonIdData<TParamButtonId>) =>
    //   appPlaybackState.playbackPublicInfoChangesStream.pipe(
    //     Stream.map(
    //       pb => pb._tag !== 'Silence' && isCurrentlyPlayingPredicate(pb, value),
    //     ),
    //     Stream.changes,
    //     Stream.rechunk(1),
    //     Stream.tap(a =>
    //       Effect.log(`${toLabel(value)} button is ${a ? '' : 'not '}playing`),
    //     ),
    //   )

    const getDownloadPercent = (value: ParamButtonIdData<TParamButtonId>) =>
      currentlySelectedAssetState
        .getPatchedAssetFetchingCompletionStatusChangesStream(value.id)
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

    // const validPressesOnlyStream = yield* bus.pressesOnlyStream.pipe(
    //   // Do we need { switch: true, concurrency: 1 } in flatMap? Seems like we
    //   // don't, because inner stream is short-lived and emits only 1 value
    //   Stream.flatMap(buttonAssignedAt =>
    //     EFunction.pipe(
    //       getPressabilityChangesStream(buttonAssignedAt),
    //       Stream.take(1),
    //       Stream.filterMap(isPressable =>
    //         isPressable ? Option.some(buttonAssignedAt) : Option.none(),
    //       ),
    //     ),
    //   ),
    //   // rechunk because of the damn bug in effect
    //   Stream.rechunk(1),
    //   Stream.broadcastDynamic({ capacity: 'unbounded' }),
    // )

    // yield* validPressesOnlyStream.pipe(
    //   Stream.tap(value => selectAction(registry, value)),
    //   Stream.runDrain,
    //   Effect.tapErrorCause(Effect.logError),
    //   Effect.forkScoped,
    // )

    return {
      getIsSelectedStream,
      // getPressabilityChangesStream,
      // isCurrentlyPlaying,
      getDownloadPercent,
      isPressedFlagChangesStream: (value: ParamButtonIdData<TParamButtonId>) =>
        bus.isPressedStream(value),
    }
  })

export class AccordParamButtonService extends Effect.Service<AccordParamButtonService>()(
  'next-midi-demo/AccordParamButtonService',
  {
    accessors: true,
    scoped: makeParamButtonService({
      registryTag: AccordRegistry,
      busTag: AccordInputBus,
      getSelectedChangesStream: reg =>
        reg.selectedAccordChanges.pipe(Stream.map(AccordParamButtonData.make)),
      toCompareValue: EFunction.identity<AccordParamButtonData>,
      toLabel: accord => `Accord ${accord.id.accord.padEnd(2)}`,
      // isCurrentlyPlayingPredicate: (pb, accord) =>
      //   pb.currentAsset.accord === accord,
      // selectAction: (reg, param) => reg.selectAccord(param.id.accord),
    }),
  },
) {}

export class PatternParamButtonService extends Effect.Service<PatternParamButtonService>()(
  'next-midi-demo/PatternParamButtonService',
  {
    accessors: true,
    scoped: makeParamButtonService({
      registryTag: PatternRegistry,
      busTag: PatternInputBus,
      getSelectedChangesStream: reg =>
        reg.selectedPatternChanges.pipe(
          Stream.map(Option.map(PatternParamButtonData.make)),
        ),
      toCompareValue: Option.some<PatternParamButtonData>,
      toLabel: pattern => `Pattern ${pattern.id.pattern}`,
      // isCurrentlyPlayingPredicate: (pb, pattern) =>
      //   Equal.equals(pb.currentAsset.pattern, Option.some(pattern)),
      // selectAction: (reg, param) => reg.switchPattern(param.id.pattern),
    }),
  },
) {}

export class StrengthParamButtonService extends Effect.Service<StrengthParamButtonService>()(
  'next-midi-demo/StrengthParamButtonService',
  {
    accessors: true,
    scoped: makeParamButtonService({
      registryTag: StrengthRegistry,
      busTag: StrengthInputBus,
      getSelectedChangesStream: reg =>
        reg.selectedStrengthChanges.pipe(
          Stream.map(StrengthParamButtonData.make),
        ),
      toCompareValue: EFunction.identity<StrengthParamButtonData>,
      toLabel: strength => `Strength ${strength.id.strength}`,
      // isCurrentlyPlayingPredicate: (pb, strength) =>
      //   pb.currentAsset.strength === strength,
      // selectAction: (reg, param) => reg.selectStrength(param.id.strength),
    }),
  },
) {}
