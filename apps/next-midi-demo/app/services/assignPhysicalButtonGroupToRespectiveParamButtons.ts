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
  RegistrationRequestArray,
} from './InputStreamBus.ts'

export const assignPhysicalButtonGroupToRespectiveParamButtons = Effect.fn(
  'assignPhysicalButtonGroupToRespectiveParamButtons',
)(function* <
  TPhysicalButtonId extends TaggedReadonlyObject,
  TParamButtonId extends TaggedReadonlyObject,
  TStreamR,
  TBusR,
>(
  physicalButtonIdDatasRepresentingPhysicalButtonGroup: EArray.NonEmptyReadonlyArray<
    PhysicalButtonIdData<TPhysicalButtonId>
  >,
  paramButtonIdDatasRepresentedByPhysicalButtonGroup: EArray.NonEmptyReadonlyArray<
    ParamButtonIdData<TParamButtonId>
  >,
  physicalButtonPressStream: Stream.Stream<
    readonly [
      id: PhysicalButtonIdData<TPhysicalButtonId>,
      physicalButtonPressState: ButtonState.AllSimple,
    ],
    never,
    TStreamR
  >,
  inputBusWriterEffect: Context.Key<
    TBusR,
    InputBusWriterHandle<TPhysicalButtonId, TParamButtonId>
  >,
) {
  if (
    physicalButtonIdDatasRepresentingPhysicalButtonGroup.length !==
    paramButtonIdDatasRepresentedByPhysicalButtonGroup.length
  )
    return yield* Effect.die(
      new Error(
        'Assertion failed: physicalButtonIds.length !== paramButtonIds.length',
      ),
    )

  const registrationsRequests: RegistrationRequestArray<
    TPhysicalButtonId,
    TParamButtonId
  > = yield* Effect.all(
    EArray.zipWith(
      paramButtonIdDatasRepresentedByPhysicalButtonGroup,
      physicalButtonIdDatasRepresentingPhysicalButtonGroup,
      (assignedToParamButtonIdData, physicalButtonIdData) =>
        Effect.map(
          SubscriptionRef.make<ButtonState.AllSimple>(ButtonState.NotPressed),
          stateRef =>
            ({
              physicalButtonIdData,
              assignedToParamButtonIdData,
              stateRef,
            }) satisfies RegistrationRequest<TPhysicalButtonId, TParamButtonId>,
        ),
    ),
    { concurrency: 'unbounded' },
  )

  const physicalButtonIdToRefWithState = HashMap.make(
    ...registrationsRequests.map(
      reg => [reg.physicalButtonIdData.id, reg.stateRef] as const,
    ),
  )

  yield* physicalButtonPressStream.pipe(
    Stream.runForEach(([physicalButtonIdData, state]) =>
      Option.match(
        HashMap.get(physicalButtonIdToRefWithState, physicalButtonIdData.id),
        {
          onNone: () => Effect.void,
          onSome: flow(
            SubscriptionRef.set(state),
            Effect.withSpan('physicalButtonRefUpdate', {
              attributes: {
                state,
                physicalButtonId: physicalButtonIdData.id,
              },
            }),
          ),
        },
      ),
    ),
    Effect.withSpan('paramButtonStateRefUpdateFiber.lifetime'),
    Effect.tapCause(Effect.logError),
    Effect.forkScoped,
  )

  const inputBus = yield* inputBusWriterEffect
  yield* inputBus.register(registrationsRequests)
})
