import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import * as PubSub from 'effect/PubSub'
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

const makeInputBus = <T>() =>
  Effect.gen(function* () {
    const mapChangesPubSub =
      yield* PubSub.unbounded<
        Stream.Stream<HashMap.HashMap<SupportedKeyData, PhysicalButtonModel<T>>>
      >()
    const latestPressesPubSub =
      yield* PubSub.unbounded<
        Stream.Stream<readonly [SupportedKeyData, PhysicalButtonModel<T>]>
      >()

    const mapChangesSubscription = yield* PubSub.subscribe(mapChangesPubSub)
    const latestPressesSubscription =
      yield* PubSub.subscribe(latestPressesPubSub)

    const pressAggregateStream = yield* Stream.fromQueue(
      mapChangesSubscription,
    ).pipe(
      Stream.flatten({ concurrency: 'unbounded' }),
      getMapCombinerStream<T>(),
      Stream.changes,
      Stream.rechunk(1),
      Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
    )

    const mergedLatestPresses = yield* Stream.fromQueue(
      latestPressesSubscription,
    ).pipe(
      Stream.flatten({ concurrency: 'unbounded' }),
      Stream.broadcastDynamic({ capacity: 'unbounded' }),
    )

    return {
      publish: <K extends SupportedKeyData>(c: {
        readonly mapChanges: Stream.Stream<
          HashMap.HashMap<K, PhysicalButtonModel<T>>
        >
        readonly latestPresses: Stream.Stream<
          readonly [K, PhysicalButtonModel<T>]
        >
      }) =>
        Effect.all(
          [
            PubSub.publish(mapChangesPubSub, c.mapChanges),
            PubSub.publish(latestPressesPubSub, c.latestPresses),
          ],
          { discard: true },
        ),
      isPressedStream: (key: T) =>
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
      forEachPress: (
        buttonActivationHandler: (assignedTo: T) => Effect.Effect<void>,
      ) =>
        mergedLatestPresses.pipe(
          Stream.filterMap(([, { buttonPressState, assignedTo }]) =>
            ButtonState.isNotPressed(buttonPressState)
              ? Option.none()
              : Option.some(assignedTo),
          ),
          Stream.tap(buttonActivationHandler),
          Stream.runDrain,
          Effect.tapErrorCause(Effect.logError),
          Effect.forkScoped,
        ),
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
