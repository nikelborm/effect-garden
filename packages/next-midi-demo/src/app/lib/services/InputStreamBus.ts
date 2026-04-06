import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import * as PubSub from 'effect/PubSub'
import type * as Scope from 'effect/Scope'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
import { ButtonState } from '../branded/index.ts'
import type { AllAccordUnion } from './AccordRegistry.ts'
import type { PhysicalButtonModel } from './makePhysicalButtonToParamMappingService.ts'
import type { AllPatternUnion } from './PatternRegistry.ts'
import type { SupportedKeyData } from './SupportedKeyData.ts'

const getMapCombinerStream =
  <T>() =>
  <E, R>(
    self: Stream.Stream<
      HashMap.HashMap<SupportedKeyData, PhysicalButtonModel<T>>,
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
                (physicalButtonModel.buttonPressState === ButtonState.Pressed
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

export interface InputBusHandle<T> {
  readonly publish: <K extends SupportedKeyData>(inputs: {
    readonly mapChanges: MapChangesStream<K, T>
    readonly latestPresses: LatestPressesStream<K, T>
  }) => Effect.Effect<void>
  readonly isPressedStream: (key: T) => Stream.Stream<boolean>
  readonly pressesOnlyStream: Stream.Stream<T>
  readonly pressAggregateStream: Stream.Stream<
    HashMap.HashMap<T, HashSet.HashSet<SupportedKeyData>>
  >
  readonly mergedLatestPresses: LatestPressesStream<SupportedKeyData, T>
}

type MapChangesStream<K extends SupportedKeyData, T> = Stream.Stream<
  HashMap.HashMap<K, PhysicalButtonModel<T>>
>
type LatestPressesStream<K extends SupportedKeyData, T> = Stream.Stream<
  readonly [K, PhysicalButtonModel<T>]
>

const makeInputBus = <T>(): Effect.Effect<
  InputBusHandle<T>,
  never,
  Scope.Scope
> =>
  Effect.gen(function* () {
    const mapChangesPubSub =
      yield* PubSub.unbounded<MapChangesStream<SupportedKeyData, T>>()

    const latestPressesPubSub =
      yield* PubSub.unbounded<LatestPressesStream<SupportedKeyData, T>>()

    const pressAggregateStream = yield* EFunction.pipe(
      Stream.fromPubSub(mapChangesPubSub),
      Stream.flatten({ concurrency: 'unbounded' }),
      getMapCombinerStream<T>(),
      Stream.changes,
      Stream.rechunk(1),
      Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
    )

    const mergedLatestPresses = yield* EFunction.pipe(
      Stream.fromPubSub(latestPressesPubSub),
      Stream.flatten({ concurrency: 'unbounded' }),
      Stream.broadcastDynamic({ capacity: 'unbounded' }),
    )

    const pressesOnlyStream = yield* mergedLatestPresses.pipe(
      Stream.filterMap(([, { buttonPressState, assignedTo }]) =>
        ButtonState.isPressed(buttonPressState)
          ? Option.some(assignedTo)
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
  { scoped: makeInputBus<AllAccordUnion>() },
) {}

export class PatternInputBus extends Effect.Service<PatternInputBus>()(
  'next-midi-demo/PatternInputBus',
  { scoped: makeInputBus<AllPatternUnion>() },
) {}

export class StrengthInputBus extends Effect.Service<StrengthInputBus>()(
  'next-midi-demo/StrengthInputBus',
  { scoped: makeInputBus<Strength>() },
) {}
