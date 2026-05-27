import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import * as PubSub from 'effect/PubSub'
import type * as Scope from 'effect/Scope'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
import { ButtonState } from '../brandsAndDatas/index.ts'
import type {
  PhysicalButtonModel,
  SupportedPhysicalButtonId,
} from '../brandsAndDatas/PhysicalButton.ts'
import type { AllAccordUnion } from './AccordRegistry.ts'
import type { AllPatternUnion } from './PatternRegistry.ts'

// TODO: make TParamButton a ParamButtonData

const getMapCombinerStream = <
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TParamButton,
>() =>
  Stream.scan<
    // out
    HashMap.HashMap<TParamButton, HashSet.HashSet<TPhysicalButtonId>>,
    // in
    HashMap.HashMap<TPhysicalButtonId, PhysicalButtonModel<TParamButton>>
  >(
    HashMap.empty(),
    (
      previousMapOfParamButtonToSetOfPhysicalButtonIds,
      latestMapOfPhysicalButtonIdToModel,
    ) =>
      HashMap.reduce(
        latestMapOfPhysicalButtonIdToModel,
        previousMapOfParamButtonToSetOfPhysicalButtonIds,
        (
          newMapOfParamButtonToSetOfPhysicalButtonIds,
          physicalButtonModel,
          physicalButtonId,
        ) =>
          HashMap.modifyAt(
            newMapOfParamButtonToSetOfPhysicalButtonIds,
            physicalButtonModel.assignedToParamButton,
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

export interface InputBusWriterHandle<
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TParamButton,
> {
  readonly publish: (
    config: InputBusInitConfig<TPhysicalButtonId, TParamButton>,
  ) => Effect.Effect<void>
}

export interface InputBusReaderHandle<
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TParamButton,
> {
  readonly isPressedStream: (
    selectionButton: TParamButton,
  ) => Stream.Stream<boolean>

  readonly pressesOnlyStream: PressesOnlyStream<TParamButton>

  readonly pressAggregateStream: PressAggregateStream<
    TPhysicalButtonId,
    TParamButton
  >

  readonly mergedLatestPresses: LatestPressesStream<
    TPhysicalButtonId,
    TParamButton
  >
}

export interface InputBusHandle<
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TParamButton,
> extends InputBusWriterHandle<TPhysicalButtonId, TParamButton>,
    InputBusReaderHandle<TPhysicalButtonId, TParamButton> {}

export interface PressesOnlyStream<TParamButton>
  extends Stream.Stream<TParamButton> {}

export interface PressAggregateStream<
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TParamButton,
> extends Stream.Stream<
    HashMap.HashMap<TParamButton, HashSet.HashSet<TPhysicalButtonId>>
  > {}

export interface InputBusInitConfig<
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TParamButton,
> {
  readonly mapChanges: MapChangesStream<TPhysicalButtonId, TParamButton>
  readonly latestPresses: LatestPressesStream<TPhysicalButtonId, TParamButton>
}

export interface MapChangesStream<
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TAssignedToParamButton,
> extends Stream.Stream<
    HashMap.HashMap<
      TPhysicalButtonId,
      PhysicalButtonModel<TAssignedToParamButton>
    >
  > {}

export interface LatestPressesStream<
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TAssignedToParamButton,
> extends Stream.Stream<
    readonly [TPhysicalButtonId, PhysicalButtonModel<TAssignedToParamButton>]
  > {}

const makeInputBus = <
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TParamButton,
>(): Effect.Effect<
  InputBusHandle<TPhysicalButtonId, TParamButton>,
  never,
  Scope.Scope
> =>
  Effect.gen(function* () {
    const mapChangesPubSub =
      yield* PubSub.unbounded<
        MapChangesStream<TPhysicalButtonId, TParamButton>
      >()

    const latestPressesPubSub =
      yield* PubSub.unbounded<
        LatestPressesStream<TPhysicalButtonId, TParamButton>
      >()

    const pressAggregateStream: PressAggregateStream<
      TPhysicalButtonId,
      TParamButton
    > = yield* EFunction.pipe(
      Stream.fromPubSub(mapChangesPubSub),
      Stream.flatten({ concurrency: 'unbounded' }),
      e => e,
      getMapCombinerStream<TPhysicalButtonId, TParamButton>(),
      Stream.changes,
      Stream.rechunk(1),
      Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
    )

    const mergedLatestPresses = yield* EFunction.pipe(
      Stream.fromPubSub(latestPressesPubSub),
      Stream.flatten({ concurrency: 'unbounded' }),
      Stream.broadcastDynamic({ capacity: 'unbounded' }),
    )

    const pressesOnlyStream: PressesOnlyStream<TParamButton> =
      yield* mergedLatestPresses.pipe(
        Stream.filterMap(([, { buttonPressState, assignedToParamButton }]) =>
          ButtonState.isPressed(buttonPressState)
            ? Option.some(assignedToParamButton)
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

export class AccordInputBus extends Effect.Service<AccordInputBus>()(
  'next-midi-demo/AccordInputBus',
  { scoped: makeInputBus<SupportedPhysicalButtonId, AllAccordUnion>() },
) {}

export class PatternInputBus extends Effect.Service<PatternInputBus>()(
  'next-midi-demo/PatternInputBus',
  { scoped: makeInputBus<SupportedPhysicalButtonId, AllPatternUnion>() },
) {}

export class StrengthInputBus extends Effect.Service<StrengthInputBus>()(
  'next-midi-demo/StrengthInputBus',
  { scoped: makeInputBus<SupportedPhysicalButtonId, Strength>() },
) {}
