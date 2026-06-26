import type * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import type { AccordData } from '../domain/Accord.ts'
import type { SimpleAssetPointer } from '../domain/AssetPointer.ts'
import type { ParamButtonIdData } from '../domain/ParamButton.ts'
import type { PatternData } from '../domain/Pattern.ts'
import type { StrengthData } from '../domain/Strength.ts'
import { AppPlaybackStateService } from './AppPlaybackStateService/AppPlaybackStateService.ts'
import {
  inferPlaying,
  inferSelection,
} from './AppPlaybackStateService/inferSelection.ts'
import {
  AccordInputBus,
  type InputBusReaderHandle,
  PatternInputBus,
  StrengthInputBus,
} from './InputStreamBus.ts'

const makeParamButtonService = <
  TParamButtonId extends PatternData | AccordData | StrengthData,
  TBusId,
>({
  busTag,
  matches,
}: {
  readonly busTag: Context.ReadonlyTag<
    TBusId,
    InputBusReaderHandle<TParamButtonId>
  >
  // Does this button's value correspond to the given (selected or playing)
  // asset? The per-kind field comparison (accord / pattern / strength).
  readonly matches: (
    asset: SimpleAssetPointer,
    value: ParamButtonIdData<TParamButtonId>,
  ) => boolean
}) =>
  Effect.gen(function* () {
    const bus = yield* busTag
    const appPlaybackState = yield* AppPlaybackStateService

    // Both flags derive from the single playback state — the state machine is
    // the source of truth (no more registries). "Selected" = the latest
    // scheduled asset; "playing" = whatever is actually sounding right now.
    const selectionChangesStream =
      appPlaybackState.playbackPublicInfoChangesStream.pipe(
        Stream.map(inferSelection),
      )
    const playingChangesStream =
      appPlaybackState.playbackPublicInfoChangesStream.pipe(
        Stream.map(inferPlaying),
      )

    // const selectedChangesStream = getSelectedChangesStream(registry)

    // const getIsSelectedStream = (value: ParamButtonIdData<TParamButtonId>) =>
    //   selectedChangesStream.pipe(
    //     Stream.map(Equal.equals(toCompareValue(value))),
    //     Stream.changes,
    //     Stream.rechunk(1),
    //     Stream.tap(isSelected =>
    //       Effect.log(
    //         `${toLabel(value)} is ${isSelected ? '' : 'not '}selected`,
    //       ),
    //     ),
    //   )

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

    // const getDownloadPercent = (value: ParamButtonIdData<TParamButtonId>) =>
    //   currentlySelectedAssetState
    //     .getPatchedAssetFetchingCompletionStatusChangesStream(value.id)
    //     .pipe(
    //       Stream.map(s =>
    //         s.status === 'not finished'
    //           ? Math.floor((s.currentBytes / ASSET_SIZE_BYTES) * 100)
    //           : s.status === 'almost finished: fetched, but not written'
    //             ? 99
    //             : 100,
    //       ),
    //       Stream.changes,
    //       Stream.rechunk(1),
    //       Stream.tap(percent =>
    //         Effect.log(`${toLabel(value)} download percent=${percent}`),
    //       ),
    //     )

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

    const getIsSelectedStream = (value: ParamButtonIdData<TParamButtonId>) =>
      selectionChangesStream.pipe(
        Stream.map(selection => matches(selection, value)),
        Stream.changes,
        Stream.rechunk(1),
      )

    const getIsPlayingStream = (value: ParamButtonIdData<TParamButtonId>) =>
      playingChangesStream.pipe(
        Stream.map(
          Option.match({
            onNone: () => false,
            onSome: playing => matches(playing, value),
          }),
        ),
        Stream.changes,
        Stream.rechunk(1),
      )

    // STUB: download progress. Under the "all assets are downloaded" assumption
    // this is genuinely always complete, not a placeholder for inference.
    const getDownloadPercent = (_value: ParamButtonIdData<TParamButtonId>) =>
      Stream.make(100)

    return {
      getIsSelectedStream,
      getIsPlayingStream,
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
      busTag: AccordInputBus,
      matches: (asset, value) => asset.accord === value.id.accord,
    }).pipe(Effect.withSpan('AccordParamButtonService.init')),
  },
) {}

export class PatternParamButtonService extends Effect.Service<PatternParamButtonService>()(
  'next-midi-demo/PatternParamButtonService',
  {
    accessors: true,
    scoped: makeParamButtonService({
      busTag: PatternInputBus,
      matches: (asset, value) =>
        Option.exists(asset.pattern, pattern => pattern === value.id.pattern),
    }).pipe(Effect.withSpan('PatternParamButtonService.init')),
  },
) {}

export class StrengthParamButtonService extends Effect.Service<StrengthParamButtonService>()(
  'next-midi-demo/StrengthParamButtonService',
  {
    accessors: true,
    scoped: makeParamButtonService({
      busTag: StrengthInputBus,
      matches: (asset, value) => asset.strength === value.id.strength,
    }).pipe(Effect.withSpan('StrengthParamButtonService.init')),
  },
) {}
