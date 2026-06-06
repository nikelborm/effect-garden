import * as Chunk from 'effect/Chunk'
import * as Effect from 'effect/Effect'
import { flow, pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import * as Queue from 'effect/Queue'
import * as Scope from 'effect/Scope'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { AccordData } from '../brandsAndDatas/Accord.ts'
import { ButtonState } from '../brandsAndDatas/index.ts'
import type { KeyboardKeyData } from '../brandsAndDatas/KeyboardKey.ts'
import type { NoteIdData } from '../brandsAndDatas/MIDIValues.ts'
import { ParamButtonIdData } from '../brandsAndDatas/ParamButton.ts'
import type { PatternData } from '../brandsAndDatas/Pattern.ts'
import type { PhysicalButtonIdData } from '../brandsAndDatas/PhysicalButton.ts'
import type { StrengthData } from '../brandsAndDatas/Strength.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'

export interface RegistrationRequest<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly stateRef: SubscriptionRef.SubscriptionRef<ButtonState.AllSimple>
  readonly physicalButtonId: PhysicalButtonIdData<TPhysicalButtonId>
  readonly assignedToParamButtonId: ParamButtonIdData<TParamButtonId>
}

interface Registration<TPhysicalButtonId extends TaggedReadonlyObject> {
  readonly stateRef: SubscriptionRef.SubscriptionRef<ButtonState.AllSimple>
  readonly physicalButtonId: TPhysicalButtonId
}

const makeParamSpecificBus = Effect.fn(function* <
  TPhysicalButtonId extends TaggedReadonlyObject,
>(scope: Scope.Scope) {
  const registrationsQueue =
    yield* Queue.unbounded<Registration<TPhysicalButtonId>>()

  return {
    add: (registration: Registration<TPhysicalButtonId>) =>
      Effect.asVoid(registrationsQueue.offer(registration)),

    paramPressedByPhysicalButtonSetStream: yield* pipe(
      Stream.fromQueue(registrationsQueue),
      Stream.flatMap(
        ({ stateRef, physicalButtonId }) =>
          Stream.map(stateRef.changes, state => ({
            physicalButtonId,
            state,
          })),
        { concurrency: 'unbounded' },
      ),
      Stream.scan(
        HashSet.empty<TPhysicalButtonId>(),
        (pressedSet, { physicalButtonId, state }) =>
          ButtonState.isPressed(state)
            ? HashSet.add(pressedSet, physicalButtonId)
            : HashSet.remove(pressedSet, physicalButtonId),
      ),
      Stream.changes,
      Stream.rechunk(1),
      Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      Scope.extend(scope),
    ),
  }
})

interface PerParamBus<TPhysicalButtonId extends TaggedReadonlyObject> {
  add: (reg: Registration<TPhysicalButtonId>) => Effect.Effect<void>
  readonly paramPressedByPhysicalButtonSetStream: Stream.Stream<
    HashSet.HashSet<TPhysicalButtonId>
  >
}

const makeInputBus = Effect.fn('makeInputBus')(function* <
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
      inputMap.changes,
      HashSet.empty<TParamButtonId>(),
      (previouslyEmitted, currentMap) => [
        HashMap.keySet(currentMap),
        HashMap.removeMany(currentMap, previouslyEmitted),
      ],
    )

  const pressesOnlyStream: PressesOnlyStream<TParamButtonId> =
    yield* newBusAdditionsStream().pipe(
      Stream.map(HashMap.entries),
      Stream.flattenIterables,
      Stream.flatMap(
        ([paramButtonId, bus]) =>
          pipe(
            bus.paramPressedByPhysicalButtonSetStream,
            Stream.map(set => HashSet.size(set) > 0),
            Stream.sliding(2),
            Stream.filter(
              chunk => !Chunk.unsafeGet(chunk, 0) && Chunk.unsafeGet(chunk, 1),
            ),
            Stream.as(new ParamButtonIdData(paramButtonId)),
          ),
        { concurrency: 'unbounded' },
      ),
      Stream.broadcastDynamic({ capacity: 'unbounded' }),
    )

  const register = (
    registrationsRequests: readonly RegistrationRequest<
      TPhysicalButtonId,
      TParamButtonId
    >[],
  ) =>
    SubscriptionRef.updateEffect(
      inputMap,
      Effect.fnUntraced(function* (existingInputs) {
        let newMap = existingInputs

        for (const {
          assignedToParamButtonId: { id: paramButtonId },
          physicalButtonId: { id: physicalButtonId },
          stateRef,
        } of registrationsRequests) {
          let bus = Option.getOrNull(HashMap.get(newMap, paramButtonId))

          if (!bus) {
            bus = yield* makeParamSpecificBus<TPhysicalButtonId>(scope)
            newMap = HashMap.set(newMap, paramButtonId, bus)
          }

          yield* bus.add({ physicalButtonId, stateRef })
        }

        return newMap
      }),
    )

  const getPressedByPhysicalButtonSetStream = (
    paramButton: ParamButtonIdData<TParamButtonId>,
  ) =>
    inputMap.changes.pipe(
      Stream.filterMap(HashMap.get(paramButton.id)),
      Stream.take(1),
      Stream.flatMap(bus => bus.paramPressedByPhysicalButtonSetStream),
    )

  const isPressedStream = flow(
    getPressedByPhysicalButtonSetStream,
    Stream.map(set => HashSet.size(set) > 0),
    Stream.changes,
    Stream.rechunk(1),
  )

  return {
    register,
    isPressedStream,
    pressesOnlyStream,
  }
})

export type SupportedPhysicalButtonIds =
  | KeyboardKeyData
  | NoteIdData
  | AccordData
  | PatternData
  | StrengthData

export class AccordInputBus extends Effect.Service<AccordInputBus>()(
  'next-midi-demo/AccordInputBus',
  {
    accessors: true,
    scoped: makeInputBus<SupportedPhysicalButtonIds, AccordData>(),
  },
) {}

export class PatternInputBus extends Effect.Service<PatternInputBus>()(
  'next-midi-demo/PatternInputBus',
  {
    accessors: true,
    scoped: makeInputBus<SupportedPhysicalButtonIds, PatternData>(),
  },
) {}

export class StrengthInputBus extends Effect.Service<StrengthInputBus>()(
  'next-midi-demo/StrengthInputBus',
  {
    accessors: true,
    scoped: makeInputBus<SupportedPhysicalButtonIds, StrengthData>(),
  },
) {}

export interface InputBusWriterHandle<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly register: (
    registrations: ReadonlyArray<
      RegistrationRequest<TPhysicalButtonId, TParamButtonId>
    >,
  ) => Effect.Effect<void>
}

export interface InputBusReaderHandle<
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly isPressedStream: (
    selectionButton: ParamButtonIdData<TParamButtonId>,
  ) => Stream.Stream<boolean>

  readonly pressesOnlyStream: PressesOnlyStream<TParamButtonId>
}

export interface InputBusHandle<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> extends InputBusWriterHandle<TPhysicalButtonId, TParamButtonId>,
    InputBusReaderHandle<TParamButtonId> {}

export interface PressesOnlyStream<TParamButtonId extends TaggedReadonlyObject>
  extends Stream.Stream<ParamButtonIdData<TParamButtonId>> {}
