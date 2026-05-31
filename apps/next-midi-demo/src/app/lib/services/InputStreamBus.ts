import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import type * as Scope from 'effect/Scope'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { AccordData } from '../brandsAndDatas/Accord.ts'
import { ButtonState } from '../brandsAndDatas/index.ts'
import type { KeyboardKeyData } from '../brandsAndDatas/KeyboardKey.ts'
import type { NoteIdData } from '../brandsAndDatas/MIDIValues.ts'
import type { ParamButtonIdData } from '../brandsAndDatas/ParamButton.ts'
import type { PatternData } from '../brandsAndDatas/Pattern.ts'
import type { PhysicalButtonIdData } from '../brandsAndDatas/PhysicalButton.ts'
import { PhysicalButtonModel } from '../brandsAndDatas/PhysicalButton.ts'
import type { StrengthData } from '../brandsAndDatas/Strength.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'

export interface PhysicalButtonRegistration<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> {
  readonly physicalButtonId: PhysicalButtonIdData<TPhysicalButtonId>
  readonly assignedToParamButtonId: ParamButtonIdData<TParamButtonId>
  readonly stateRef: SubscriptionRef.SubscriptionRef<ButtonState.AllSimple>
}

// Converts an append-only SubscriptionRef<ReadonlyArray<T>> into a flat stream
// of new elements. A new subscriber atomically receives all current items first,
// then future additions — preserving async init ordering without replay buffers.
const streamNewRegistrations = <
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
>(
  ref: SubscriptionRef.SubscriptionRef<
    ReadonlyArray<PhysicalButtonRegistration<TPhysicalButtonId, TParamButtonId>>
  >,
): Stream.Stream<
  PhysicalButtonRegistration<TPhysicalButtonId, TParamButtonId>
> =>
  ref.changes.pipe(
    Stream.mapAccum(
      0,
      (prevLen, latestStateOfRegistrationsStore) =>
        [
          latestStateOfRegistrationsStore.length,
          latestStateOfRegistrationsStore.slice(prevLen),
        ] as const,
    ),
    e => e,
    Stream.flatMap(a => Stream.fromIterable(a)),
  )

const makeInputBus = Effect.fn('makeInputBus')(function* <
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
>(): Effect.fn.Return<
  InputBusHandle<TPhysicalButtonId, TParamButtonId>,
  never,
  Scope.Scope
> {
  const registrationsRef = yield* SubscriptionRef.make(
    [] as ReadonlyArray<
      PhysicalButtonRegistration<TPhysicalButtonId, TParamButtonId>
    >,
  )

  const pressAggregateStream: PressAggregateStream<
    TPhysicalButtonId,
    TParamButtonId
  > = yield* streamNewRegistrations(registrationsRef).pipe(
    Stream.flatMap(
      reg =>
        reg.stateRef.changes.pipe(
          Stream.map(state => ({
            physId: reg.physicalButtonId,
            paramId: reg.assignedToParamButtonId,
            state,
          })),
        ),
      { concurrency: 'unbounded', switch: false },
    ),
    Stream.scan(
      HashMap.empty<
        ParamButtonIdData<TParamButtonId>,
        HashSet.HashSet<PhysicalButtonIdData<TPhysicalButtonId>>
      >(),
      (aggregate, { physId, paramId, state }) =>
        HashMap.modifyAt(
          aggregate,
          paramId,
          EFunction.flow(
            Option.orElseSome(HashSet.empty),
            Option.map(
              ButtonState.isPressed(state)
                ? HashSet.add(physId)
                : HashSet.remove(physId),
            ),
          ),
        ),
    ),
    Stream.changes,
    Stream.rechunk(1),
    Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
  )

  const mergedLatestPresses: LatestPressesStream<
    TPhysicalButtonId,
    TParamButtonId
  > = yield* streamNewRegistrations(registrationsRef).pipe(
    Stream.flatMap(
      reg =>
        reg.stateRef.changes.pipe(
          Stream.map(
            state =>
              [
                reg.physicalButtonId,
                new PhysicalButtonModel(state, reg.assignedToParamButtonId),
              ] as const,
          ),
        ),
      { concurrency: 'unbounded', switch: false },
    ),
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
    publish: registrations =>
      SubscriptionRef.update(registrationsRef, EArray.appendAll(registrations)),
    isPressedStream: paramButton =>
      streamNewRegistrations(registrationsRef).pipe(
        Stream.filter(reg =>
          Equal.equals(reg.assignedToParamButtonId, paramButton),
        ),
        Stream.flatMap(
          reg =>
            reg.stateRef.changes.pipe(
              Stream.map(state => [reg.physicalButtonId, state] as const),
            ),
          { concurrency: 'unbounded', switch: false },
        ),
        Stream.scan(
          HashSet.empty<PhysicalButtonIdData<TPhysicalButtonId>>(),
          (pressedSet, [physId, state]) =>
            ButtonState.isPressed(state)
              ? HashSet.add(pressedSet, physId)
              : HashSet.remove(pressedSet, physId),
        ),
        Stream.map(set => HashSet.size(set) > 0),
        Stream.changes,
        Stream.rechunk(1),
      ),
    pressesOnlyStream,
    pressAggregateStream,
    mergedLatestPresses,
  }
})

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
    registrations: ReadonlyArray<
      PhysicalButtonRegistration<TPhysicalButtonId, TParamButtonId>
    >,
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

export interface LatestPressesStream<
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
> extends Stream.Stream<
    readonly [
      PhysicalButtonIdData<TPhysicalButtonId>,
      PhysicalButtonModel<TParamButtonId>,
    ]
  > {}
