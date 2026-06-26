import * as EArray from 'effect/Array'
import type * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import { flow } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import * as ButtonState from '../domain/ButtonState.ts'
import type { ParamButtonIdData } from '../domain/ParamButton.ts'
import type { PhysicalButtonIdData } from '../domain/PhysicalButton.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import type {
  InputBusWriterHandle,
  RegistrationRequest,
} from './InputStreamBus.ts'

export const assignPhysicalButtonGroupToRespectiveParamButtons = Effect.fn(
  'assignPhysicalButtonGroupToRespectiveParamButtons',
)(function* <
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
  inputBusWriterEffect: Context.ReadonlyTag<
    TBusR,
    InputBusWriterHandle<TPhysicalButtonId, TParamButtonId>
  >,
) {
  if (
    physicalButtonIdsRepresentingPhysicalButtonGroup.length !==
    paramButtonIdsRepresentedByPhysicalButtonGroup.length
  )
    return yield* Effect.dieMessage(
      'Assertion failed: physicalButtonIds.length !== paramButtonIds.length',
    )

  const registrations: ReadonlyArray<
    RegistrationRequest<TPhysicalButtonId, TParamButtonId>
  > = yield* Effect.all(
    EArray.zipWith(
      paramButtonIdsRepresentedByPhysicalButtonGroup,
      physicalButtonIdsRepresentingPhysicalButtonGroup,
      (assignedToParamButtonId, physicalButtonId) =>
        Effect.map(
          SubscriptionRef.make<ButtonState.AllSimple>(ButtonState.NotPressed),
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
      reg => [reg.physicalButtonId.id, reg.stateRef] as const,
    ),
  )

  yield* physicalButtonPressStream.pipe(
    Stream.runForEach(([physicalButtonId, state]) =>
      Option.match(HashMap.get(physicalButtonIdToRef, physicalButtonId.id), {
        onNone: () => Effect.void,
        onSome: flow(
          SubscriptionRef.set(state),
          Effect.withSpan('physicalButtonRefUpdate', {
            attributes: {
              state,
              physicalButtonId: physicalButtonId.id,
            },
          }),
        ),
      }),
    ),
    Effect.withSpan('paramButtonStateRefUpdateFiber.lifetime'),
    Effect.tapErrorCause(Effect.logError),
    Effect.forkScoped,
  )

  const inputBus = yield* inputBusWriterEffect
  yield* inputBus.register(registrations)
})
