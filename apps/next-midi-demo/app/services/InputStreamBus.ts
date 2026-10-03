/** biome-ignore-all lint/correctness/useHookAtTopLevel: these are not hooks> */
import type { NonEmptyReadonlyArray } from 'effect/Array'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Filter from 'effect/Filter'
import { pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as HashSet from 'effect/HashSet'
import * as Iterable from 'effect/Iterable'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Queue from 'effect/Queue'
import * as Scope from 'effect/Scope'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { AccordData } from '../domain/Accord.ts'
import * as ButtonState from '../domain/ButtonState.ts'
import type { KeyboardKeyData } from '../domain/KeyboardKey.ts'
import type { NoteIdData } from '../domain/MIDIValues.ts'
import { ParamButtonIdData } from '../domain/ParamButton.ts'
import type { PatternData } from '../domain/Pattern.ts'
import type { PhysicalButtonIdData } from '../domain/PhysicalButton.ts'
import type { StrengthData } from '../domain/Strength.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'

export interface RegistrationRequest<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly stateRef: SubscriptionRef.SubscriptionRef<ButtonState.AllSimple>
  readonly physicalButtonIdData: PhysicalButtonIdData<TPhysicalButtonId>
  readonly assignedToParamButtonIdData: ParamButtonIdData<TParamButtonId>
}

export type RegistrationRequestArray<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> = NonEmptyReadonlyArray<
  RegistrationRequest<TPhysicalButtonId, TParamButtonId>
>

interface Registration<TPhysicalButtonId extends TaggedReadonlyObject> {
  readonly stateRef: SubscriptionRef.SubscriptionRef<ButtonState.AllSimple>
  readonly physicalButtonId: TPhysicalButtonId
}

const makeParamSpecificBus = Effect.fn('makeParamSpecificBus')(function* <
  TParamButtonId extends TaggedReadonlyObject,
  TPhysicalButtonId extends TaggedReadonlyObject = TaggedReadonlyObject,
>(paramButtonId: TParamButtonId) {
  yield* Effect.annotateCurrentSpan({ paramButtonId })
  const registrationsQueue =
    yield* Queue.unbounded<Registration<TPhysicalButtonId>>()

  return {
    add: Effect.fn('ParamSpecificBus.add')(function* (
      registration: Registration<TPhysicalButtonId>,
    ) {
      yield* Effect.annotateCurrentSpan({
        paramButtonId: paramButtonId,
        physicalButtonId: registration.physicalButtonId,
      })
      yield* Queue.offer(registrationsQueue, registration)
    }),

    paramPressedByPhysicalButtonSetStream: yield* pipe(
      Stream.fromQueue(registrationsQueue),
      Stream.flatMap(
        ({ stateRef, physicalButtonId }) =>
          Stream.map(SubscriptionRef.changes(stateRef), state => ({
            physicalButtonId,
            state,
          })),
        { concurrency: 'unbounded' },
      ),
      Stream.scan(
        () => HashSet.empty<TPhysicalButtonId>(),
        (pressedSet, { physicalButtonId, state }) =>
          ButtonState.isPressed(state)
            ? HashSet.add(pressedSet, physicalButtonId)
            : HashSet.remove(pressedSet, physicalButtonId),
      ),
      Stream.changes,
      Stream.withSpan('paramPressedByPhysicalButtonSetStream', {
        attributes: { paramButtonId },
      }),
      Stream.broadcast({ capacity: 'unbounded', replay: 1 }),
    ),
  }
})

interface PerParamBus<TPhysicalButtonId extends TaggedReadonlyObject> {
  add: (reg: Registration<TPhysicalButtonId>) => Effect.Effect<void>
  readonly paramPressedByPhysicalButtonSetStream: Stream.Stream<
    HashSet.HashSet<TPhysicalButtonId>
  >
}

const makeInputBus = Effect.fnUntraced(function* <
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
>(): Effect.fn.Return<
  InputBusHandle<TPhysicalButtonId, TParamButtonId>,
  never,
  Scope.Scope
> {
  const scope = yield* Effect.scope

  // a hashmap ref instead of pubsub to dedup by param button id
  const inputMap = yield* SubscriptionRef.make(
    HashMap.empty<TParamButtonId, PerParamBus<TPhysicalButtonId>>(),
  )

  const newBusAdditionsStream = (): Stream.Stream<
    HashMap.HashMap<TParamButtonId, PerParamBus<TPhysicalButtonId>>
  > =>
    Stream.mapAccum(
      SubscriptionRef.changes(inputMap),
      () => Iterable.empty<TParamButtonId>(),
      (previouslyEmitted, currentMap) => [
        HashMap.keys(currentMap),
        [HashMap.removeMany(currentMap, previouslyEmitted)],
      ],
    )

  const pressedDownParamButtonIdDataStream: PressedDownParamButtonIdDataStream<TParamButtonId> =
    yield* newBusAdditionsStream().pipe(
      Stream.map(HashMap.entries),
      Stream.flattenIterable,
      Stream.flatMap(
        ([paramButtonId, bus]) =>
          pipe(
            bus.paramPressedByPhysicalButtonSetStream,
            Stream.map(set => HashSet.size(set) > 0),
            Stream.sliding(2),
            Stream.filter(window => window[0] === false && window[1] === true),
            Stream.as(new ParamButtonIdData(paramButtonId)),
          ),
        { concurrency: 'unbounded' },
      ),
      Stream.withSpan('pressedDownParamButtonIdDataStream'),
      Stream.broadcast({ capacity: 'unbounded' }),
    )

  const register: RegisterMethod<
    TPhysicalButtonId,
    TParamButtonId
  > = registrationsRequests =>
    inputMap.pipe(
      SubscriptionRef.updateEffect(
        Effect.fnUntraced(function* (existingInputs) {
          let newMap = existingInputs

          for (const {
            assignedToParamButtonIdData: { id: paramButtonId },
            physicalButtonIdData: { id: physicalButtonId },
            stateRef,
          } of registrationsRequests) {
            let bus = Option.getOrNull(HashMap.get(newMap, paramButtonId))

            if (!bus) {
              bus = yield* makeParamSpecificBus<
                TParamButtonId,
                TPhysicalButtonId
              >(paramButtonId).pipe(Scope.provide(scope))

              newMap = HashMap.set(newMap, paramButtonId, bus)
            }

            yield* bus.add({ physicalButtonId, stateRef })
          }

          return newMap
        }),
      ),
      Effect.withSpan('InputBus.register'),
    )

  const getPressedByPhysicalButtonSetStream = (
    paramButton: ParamButtonIdData<TParamButtonId>,
  ) =>
    SubscriptionRef.changes(inputMap).pipe(
      Stream.filterMap(Filter.fromPredicateOption(HashMap.get(paramButton.id))),
      Stream.take(1),
      Stream.flatMap(bus => bus.paramPressedByPhysicalButtonSetStream),
      Stream.withSpan('paramPressedByPhysicalButtonSetStreamById', {
        attributes: { paramButtonId: paramButton.id },
      }),
    )

  const isPressedStream: IsPressedStreamMethod<TParamButtonId> = paramButton =>
    pipe(
      getPressedByPhysicalButtonSetStream(paramButton),
      Stream.map(set => HashSet.size(set) > 0),
      Stream.changes,
      Stream.withSpan('isPressedStream', {
        attributes: { paramButtonId: paramButton.id },
      }),
    )

  return { register, isPressedStream, pressedDownParamButtonIdDataStream }
})

export type SupportedPhysicalButtonIds =
  | KeyboardKeyData
  | NoteIdData
  // the last three come from onscreen buttons
  // TODO: probably would be better to wrap them with OnScreenButtonIdData<T>
  | AccordData
  | PatternData
  | StrengthData

export class AccordInputBus extends Context.Service<AccordInputBus>()(
  'next-midi-demo/AccordInputBus',
  {
    make: makeInputBus<SupportedPhysicalButtonIds, AccordData>().pipe(
      Effect.withSpan('AccordInputBus.init'),
    ),
  },
) {
  static pressedDownParamButtonIdDataStream = Stream.unwrap(
    this.useSync(bus => bus.pressedDownParamButtonIdDataStream),
  )
}

export const AccordInputBusLayer: Layer.Layer<AccordInputBus> = Layer.effect(
  AccordInputBus,
  AccordInputBus.make,
)

export class PatternInputBus extends Context.Service<PatternInputBus>()(
  'next-midi-demo/PatternInputBus',
  {
    make: makeInputBus<SupportedPhysicalButtonIds, PatternData>().pipe(
      Effect.withSpan('PatternInputBus.init'),
    ),
  },
) {
  static pressedDownParamButtonIdDataStream = Stream.unwrap(
    this.useSync(bus => bus.pressedDownParamButtonIdDataStream),
  )
}

export const PatternInputBusLayer: Layer.Layer<PatternInputBus> = Layer.effect(
  PatternInputBus,
  PatternInputBus.make,
)

export class StrengthInputBus extends Context.Service<StrengthInputBus>()(
  'next-midi-demo/StrengthInputBus',
  {
    make: makeInputBus<SupportedPhysicalButtonIds, StrengthData>().pipe(
      Effect.withSpan('StrengthInputBus.init'),
    ),
  },
) {
  static pressedDownParamButtonIdDataStream = Stream.unwrap(
    this.useSync(bus => bus.pressedDownParamButtonIdDataStream),
  )
}

export const StrengthInputBusLayer: Layer.Layer<StrengthInputBus> =
  Layer.effect(StrengthInputBus, StrengthInputBus.make)

export interface RegisterMethod<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> {
  (
    registrationsRequests: RegistrationRequestArray<
      TPhysicalButtonId,
      TParamButtonId
    >,
  ): Effect.Effect<void>
}

export interface InputBusWriterHandle<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly register: RegisterMethod<TPhysicalButtonId, TParamButtonId>
}

export interface IsPressedStreamMethod<
  TParamButtonId extends TaggedReadonlyObject,
> {
  (selectionButton: ParamButtonIdData<TParamButtonId>): Stream.Stream<boolean>
}

export interface InputBusReaderHandle<
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly isPressedStream: IsPressedStreamMethod<TParamButtonId>

  readonly pressedDownParamButtonIdDataStream: PressedDownParamButtonIdDataStream<TParamButtonId>
}

export interface InputBusHandle<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> extends InputBusWriterHandle<TPhysicalButtonId, TParamButtonId>,
    InputBusReaderHandle<TParamButtonId> {}

export interface PressedDownParamButtonIdDataStream<
  TParamButtonId extends TaggedReadonlyObject,
> extends Stream.Stream<ParamButtonIdData<TParamButtonId>> {}
