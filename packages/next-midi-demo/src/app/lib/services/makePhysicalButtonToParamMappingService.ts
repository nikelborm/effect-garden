import * as EArray from 'effect/Array'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import type * as Order from 'effect/Order'
import * as Ref from 'effect/Ref'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../branded/index.ts'

export const makePhysicalButtonToParamMappingService = <
  PhysicalButtonId,
  AssignedTo,
  R,
>(
  physicalButtonIdOrder: Order.Order<PhysicalButtonId>,
  allPhysicalButtonIds: readonly PhysicalButtonId[],
  allEntities: readonly AssignedTo[],
  buttonPressStream: Stream.Stream<
    readonly [
      id: PhysicalButtonId,
      physicalButtonPressState: ButtonState.AllSimple,
    ],
    never,
    R
  >,
) =>
  Effect.gen(function* () {
    if (allEntities.length !== allPhysicalButtonIds.length)
      return yield* Effect.dieMessage(
        'Assertion failed: allEntities.length !== allPhysicalButtonIds.length',
      )

    const physicalButtonIdToModelMapRef = yield* Ref.make(
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

    const currentMap = Ref.get(physicalButtonIdToModelMapRef)

    const getPhysicalButtonModel = (id: PhysicalButtonId) =>
      Effect.map(currentMap, SortedMap.get(id))

    // TODO: maybe move {id -> ButtonModel.assignedTo} into a separate map?

    // These 2 separate streams have 2 non atomic Ref method calls. And it's
    // fine because the keys of the map are permanent, and the value, the first
    // call depends on (previousButtonModel.assignedTo) is permanent
    const latestPhysicalButtonModelsStream = yield* buttonPressStream.pipe(
      Stream.mapEffect(
        ([id, physicalButtonPressState]) =>
          Effect.map(
            Ref.get(physicalButtonIdToModelMapRef),
            EFunction.flow(
              SortedMap.get(id),
              Option.map(
                previousButtonModel =>
                  [
                    id,
                    new PhysicalButtonModel(
                      physicalButtonPressState,
                      previousButtonModel.assignedTo,
                    ),
                  ] as const,
              ),
            ),
          ),
        { concurrency: 1 },
      ),
      Stream.filterMap(e => e),
      Stream.broadcastDynamic({ capacity: 'unbounded' }),
    )

    const mapChanges = yield* latestPhysicalButtonModelsStream.pipe(
      Stream.mapEffect(
        ([id, latestButtonModel]) =>
          Ref.updateAndGet(
            physicalButtonIdToModelMapRef,
            SortedMap.set(id, latestButtonModel),
          ),
        { concurrency: 1 },
      ),
      Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
    )

    return {
      currentMap,
      latestPhysicalButtonModelsStream,
      mapChanges,
      getPhysicalButtonModel,
    }
  })

export class PhysicalButtonModel<AssignedTo> extends Data.Class<{
  buttonPressState: ButtonState.AllSimple
  assignedTo: AssignedTo
}> {
  constructor(buttonPressState: ButtonState.AllSimple, assignedTo: AssignedTo) {
    super({ buttonPressState, assignedTo })
  }
}
