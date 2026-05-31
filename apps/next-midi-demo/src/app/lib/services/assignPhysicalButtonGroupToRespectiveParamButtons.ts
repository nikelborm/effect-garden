import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { ButtonState } from '../brandsAndDatas/index.ts'
import type { ParamButtonIdData } from '../brandsAndDatas/ParamButton.ts'
import type { PhysicalButtonIdData } from '../brandsAndDatas/PhysicalButton.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import type {
  InputBusWriterHandle,
  PhysicalButtonRegistration,
} from './InputStreamBus.ts'

export const assignPhysicalButtonGroupToRespectiveParamButtons = <
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
  TStreamR,
  TBusR,
>(
  physicalButtonIdsRepresentingPhysicalButtonGroup: readonly PhysicalButtonIdData<TPhysicalButtonId>[],
  paramButtonIdsRepresentedByPhysicalButtonGroup: readonly ParamButtonIdData<TParamButtonId>[],
  physicalButtonPressStream: Stream.Stream<
    readonly [
      id: PhysicalButtonIdData<TPhysicalButtonId>,
      physicalButtonPressState: ButtonState.AllSimple,
    ],
    never,
    TStreamR
  >,
  inputBusWriterEffect: Effect.Effect<
    InputBusWriterHandle<TPhysicalButtonId, TParamButtonId>,
    never,
    TBusR
  >,
) =>
  Effect.gen(function* () {
    if (
      physicalButtonIdsRepresentingPhysicalButtonGroup.length !==
      paramButtonIdsRepresentedByPhysicalButtonGroup.length
    )
      return yield* Effect.dieMessage(
        'Assertion failed: physicalButtonIds.length !== paramButtonIds.length',
      )

    const registrations: ReadonlyArray<
      PhysicalButtonRegistration<TPhysicalButtonId, TParamButtonId>
    > = yield* Effect.all(
      EArray.zipWith(
        paramButtonIdsRepresentedByPhysicalButtonGroup,
        physicalButtonIdsRepresentingPhysicalButtonGroup,
        (assignedToParamButtonId, physicalButtonId) =>
          Effect.map(
            SubscriptionRef.make(
              ButtonState.NotPressed as ButtonState.AllSimple,
            ),
            stateRef => ({
              physicalButtonId,
              assignedToParamButtonId,
              stateRef,
            }),
          ),
      ),
      { concurrency: 'unbounded' },
    )

    const physicalButtonIdToRef = HashMap.make(
      ...registrations.map(
        reg => [reg.physicalButtonId, reg.stateRef] as const,
      ),
    )

    yield* physicalButtonPressStream.pipe(
      Stream.mapEffect(
        ([physicalButtonId, state]) =>
          Option.match(HashMap.get(physicalButtonIdToRef, physicalButtonId), {
            onNone: () => Effect.void,
            onSome: SubscriptionRef.set(state),
          }),
        { concurrency: 1 },
      ),
      Stream.runDrain,
      Effect.forkScoped,
    )

    const inputBus = yield* inputBusWriterEffect
    yield* inputBus.publish(registrations)
  })
