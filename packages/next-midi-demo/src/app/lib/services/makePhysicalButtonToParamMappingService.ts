import * as EArray from 'effect/Array'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import type * as Order from 'effect/Order'
import * as SortedMap from 'effect/SortedMap'
import type * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { ButtonState } from '../branded/index.ts'
import { reactivelySchedule } from '../helpers/reactiveFiberScheduler.ts'
import { sortedMapModifyAt } from '../helpers/sortedMapModifyAt.ts'

export const makePhysicalButtonToParamMappingService = <
  PhysicalButtonId,
  AssignedTo,
>(
  physicalButtonIdOrder: Order.Order<PhysicalButtonId>,
  allPhysicalButtonIds: readonly PhysicalButtonId[],
  allEntities: readonly AssignedTo[],
  buttonPressStream: Stream.Stream<
    readonly [
      id: PhysicalButtonId,
      physicalButtonPressState: ButtonState.AllSimple,
    ]
  >,
) =>
  Effect.gen(function* () {
    if (allEntities.length !== allPhysicalButtonIds.length)
      return yield* Effect.dieMessage(
        'Assertion failed: allEntities.length !== allPhysicalButtonIds.length',
      )

    const physicalButtonIdToModelMapRef = yield* SubscriptionRef.make(
      SortedMap.make(physicalButtonIdOrder)(
        ...EArray.zipWith(
          allEntities,
          allPhysicalButtonIds,
          (assignedTo, id) =>
            [
              id,
              new PhysicalButtonModel(ButtonState.NotPressed, assignedTo),
            ] as const,
        ),
      ),
    )

    const currentMap = SubscriptionRef.get(physicalButtonIdToModelMapRef)

    const getPhysicalButtonModel = (id: PhysicalButtonId) =>
      Effect.map(
        currentMap,
        EFunction.flow(
          SortedMap.get(id),
          Option.getOrElse(
            () => new PhysicalButtonModel<AssignedTo>(ButtonState.NotPressed),
          ),
        ),
      )

    yield* reactivelySchedule(
      buttonPressStream,
      ([id, physicalButtonPressState]) =>
        SubscriptionRef.update(
          physicalButtonIdToModelMapRef,
          sortedMapModifyAt(id, idModelOption =>
            Option.some(
              new PhysicalButtonModel(
                physicalButtonPressState,
                idModelOption._tag === 'Some'
                  ? idModelOption.value?.assignedTo
                  : undefined,
              ),
            ),
          ),
        ),
    )

    return {
      currentMap,
      mapChanges: physicalButtonIdToModelMapRef.changes,
      getPhysicalButtonModel,
    }
  })

export class PhysicalButtonModel<AssignedTo> extends Data.Class<{
  buttonPressState: ButtonState.AllSimple
  assignedTo?: AssignedTo
}> {
  constructor(
    buttonPressState: ButtonState.AllSimple,
    assignedTo?: AssignedTo,
  ) {
    super({ buttonPressState, ...(assignedTo && { assignedTo }) })
  }
}
