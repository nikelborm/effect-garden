import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import * as PubSub from 'effect/PubSub'
import type * as Scope from 'effect/Scope'
import * as Stream from 'effect/Stream'

import type { AccordData } from '../brandsAndDatas/Accord.ts'
import { ButtonState } from '../brandsAndDatas/index.ts'
import type { KeyboardKeyData } from '../brandsAndDatas/KeyboardKey.ts'
import type { NoteIdData } from '../brandsAndDatas/MIDIValues.ts'
import type { ParamButtonIdData } from '../brandsAndDatas/ParamButton.ts'
import type { PatternData } from '../brandsAndDatas/Pattern.ts'
import type {
  PhysicalButtonIdData,
  PhysicalButtonModel,
} from '../brandsAndDatas/PhysicalButton.ts'
import type { StrengthData } from '../brandsAndDatas/Strength.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'

const makeInputBus = Effect.fn('makeInputBus')(function* <
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
>(): Effect.fn.Return<
  InputBusHandle<TPhysicalButtonId, TParamButtonId>,
  never,
  Scope.Scope
> {
  const mapChangesPubSub =
    yield* PubSub.unbounded<
      MapChangesStream<TPhysicalButtonId, TParamButtonId>
    >()

  const latestPressesPubSub =
    yield* PubSub.unbounded<
      LatestPressesStream<TPhysicalButtonId, TParamButtonId>
    >()

  const pressAggregateStream: PressAggregateStream<
    TPhysicalButtonId,
    TParamButtonId
  > = yield* EFunction.pipe(
    Stream.fromPubSub(mapChangesPubSub),
    Stream.flatten({ concurrency: 'unbounded' }),
    e => e,
    getMapCombinerStream<TPhysicalButtonId, TParamButtonId>(),
    Stream.changes,
    Stream.rechunk(1),
    Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
  )

  const mergedLatestPresses = yield* EFunction.pipe(
    Stream.fromPubSub(latestPressesPubSub),
    Stream.flatten({ concurrency: 'unbounded' }),
    Stream.broadcastDynamic({ capacity: 'unbounded' }),
  )

  const pressesOnlyStream: PressesOnlyStream<TParamButtonId> =
    yield* mergedLatestPresses.pipe(
      Stream.filterMap(([, { buttonPressState, assignedToParamButtonId }]) =>
        ButtonState.isPressed(buttonPressState)
          ? Option.some(assignedToParamButtonId)
          : Option.none(),
      ),
      Stream.rechunk(1),
      Stream.broadcastDynamic({ capacity: 'unbounded' }),
    )

  return {
    publish: inputs =>
      Effect.all(
        [
          PubSub.publish(mapChangesPubSub, inputs.mapChanges),
          PubSub.publish(latestPressesPubSub, inputs.latestPresses),
        ],
        { discard: true },
      ),
    isPressedStream: key =>
      pressAggregateStream.pipe(
        Stream.map(
          EFunction.flow(
            HashMap.get(key),
            Option.map(set => HashSet.size(set) !== 0),
            Option.getOrElse(() => false),
          ),
        ),
        Stream.changes,
        Stream.rechunk(1),
      ),
    pressesOnlyStream,
    pressAggregateStream,
    mergedLatestPresses,
  }
})

// TODO: add DOM here
export type SupportedInputs =
  | KeyboardKeyData
  | NoteIdData
  | AccordData
  | PatternData
  | StrengthData

export class AccordInputBus extends Effect.Service<AccordInputBus>()(
  'next-midi-demo/AccordInputBus',
  { scoped: makeInputBus<SupportedInputs, AccordData>() },
) {}

export class PatternInputBus extends Effect.Service<PatternInputBus>()(
  'next-midi-demo/PatternInputBus',
  { scoped: makeInputBus<SupportedInputs, PatternData>() },
) {}

export class StrengthInputBus extends Effect.Service<StrengthInputBus>()(
  'next-midi-demo/StrengthInputBus',
  { scoped: makeInputBus<SupportedInputs, StrengthData>() },
) {}

export interface InputBusWriterHandle<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly publish: (
    config: InputBusInitConfig<TPhysicalButtonId, TParamButtonId>,
  ) => Effect.Effect<void>
}

export interface InputBusReaderHandle<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly isPressedStream: (
    selectionButton: ParamButtonIdData<TParamButtonId>,
  ) => Stream.Stream<boolean>

  readonly pressesOnlyStream: PressesOnlyStream<TParamButtonId>

  readonly pressAggregateStream: PressAggregateStream<
    TPhysicalButtonId,
    TParamButtonId
  >

  readonly mergedLatestPresses: LatestPressesStream<
    TPhysicalButtonId,
    TParamButtonId
  >
}

export interface InputBusHandle<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> extends InputBusWriterHandle<TPhysicalButtonId, TParamButtonId>,
    InputBusReaderHandle<TPhysicalButtonId, TParamButtonId> {}

export interface PressesOnlyStream<TParamButtonId extends TaggedReadonlyObject>
  extends Stream.Stream<ParamButtonIdData<TParamButtonId>> {}

export interface LatestMap<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> extends HashMap.HashMap<
    PhysicalButtonIdData<TPhysicalButtonId>,
    PhysicalButtonModel<TParamButtonId>
  > {}

export interface AggregateMap<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> extends HashMap.HashMap<
    ParamButtonIdData<TParamButtonId>,
    HashSet.HashSet<PhysicalButtonIdData<TPhysicalButtonId>>
  > {}

export interface PressAggregateStream<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> extends Stream.Stream<AggregateMap<TPhysicalButtonId, TParamButtonId>> {}

export interface InputBusInitConfig<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly mapChanges: MapChangesStream<TPhysicalButtonId, TParamButtonId>
  readonly latestPresses: LatestPressesStream<TPhysicalButtonId, TParamButtonId>
}

export interface MapChangesStream<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> extends Stream.Stream<LatestMap<TPhysicalButtonId, TParamButtonId>> {}

export interface LatestPressesStream<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> extends Stream.Stream<
    readonly [
      PhysicalButtonIdData<TPhysicalButtonId>,
      PhysicalButtonModel<TParamButtonId>,
    ]
  > {}

function getMapCombinerStream<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
>() {
  return Stream.scan<
    // out
    AggregateMap<TPhysicalButtonId, TParamButtonId>,
    // in
    LatestMap<TPhysicalButtonId, TParamButtonId>
  >(
    HashMap.empty(),
    (
      previousMapOfParamButtonToSetOfPhysicalButtonIds,
      latestMapOfPhysicalButtonIdToModel,
    ) =>
      HashMap.reduce(
        // will sequentially apply latest map's entries to start point
        latestMapOfPhysicalButtonIdToModel,
        // zero start point
        previousMapOfParamButtonToSetOfPhysicalButtonIds,
        (
          newMapOfParamButtonToSetOfPhysicalButtonIds,
          physicalButtonModel,
          physicalButtonId,
        ) =>
          HashMap.modifyAt(
            newMapOfParamButtonToSetOfPhysicalButtonIds,
            physicalButtonModel.assignedToParamButtonId,
            EFunction.flow(
              Option.orElseSome(HashSet.empty),
              Option.map(
                (physicalButtonModel.buttonPressState === ButtonState.Pressed
                  ? HashSet.add
                  : HashSet.remove)(physicalButtonId),
              ),
            ),
          ),
      ),
  )
}
