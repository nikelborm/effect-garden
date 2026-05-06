import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../brandsAndDatas/index.ts'
import {
  PhysicalButtonModel,
  type SupportedPhysicalButtonId,
} from '../brandsAndDatas/PhysicalButton.ts'
import type { InputBusWriterHandle } from './InputStreamBus.ts'

export const assignPhysicalButtonGroupToRespectiveParamButtons = <
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TAssignedToParamButton,
  R,
  BusR,
>(
  allPhysicalButtonIdsRepresentingPhysicalButtonGroup: readonly TPhysicalButtonId[],
  allParamButtonsRepresentedByPhysicalButtonGroup: readonly TAssignedToParamButton[],
  physicalButtonPressStream: Stream.Stream<
    readonly [
      id: TPhysicalButtonId,
      physicalButtonPressState: ButtonState.AllSimple,
    ],
    never,
    R
  >,
  inputBusWriterEffect: Effect.Effect<
    InputBusWriterHandle<TPhysicalButtonId, TAssignedToParamButton>,
    never,
    BusR
  >,
) =>
  Effect.gen(function* () {
    if (
      allPhysicalButtonIdsRepresentingPhysicalButtonGroup.length !==
      allParamButtonsRepresentedByPhysicalButtonGroup.length
    )
      return yield* Effect.dieMessage(
        'Assertion failed: allEntities.length !== allPhysicalButtonIds.length',
      )

    const physicalButtonIdToModelMapRef = yield* Ref.make(
      HashMap.make(
        ...EArray.zipWith(
          allParamButtonsRepresentedByPhysicalButtonGroup,
          allPhysicalButtonIdsRepresentingPhysicalButtonGroup,

          (paramButtonThePhysicalButtonIsAssignedTo, physicalButtonId) =>
            [
              physicalButtonId,
              new PhysicalButtonModel(
                ButtonState.NotPressed,
                paramButtonThePhysicalButtonIsAssignedTo,
              ),
            ] as const,
        ),
      ),
    )

    const currentMapEffect = Ref.get(physicalButtonIdToModelMapRef)

    // TODO: maybe move {id -> ButtonModel.assignedToParamButton} into a separate map?

    // These 2 separate streams (latestPhysicalButtonModelsStream, mapChanges)
    // have 2 non atomic Ref method calls. And it's fine because the keys of the
    // map are permanent, and the value, the first call depends on
    // (previousButtonModel.assignedToParamButton) is permanent
    const latestPhysicalButtonModelsStream =
      yield* physicalButtonPressStream.pipe(
        Stream.mapEffect(
          ([id, physicalButtonPressState]) =>
            Effect.map(
              currentMapEffect,
              EFunction.flow(
                HashMap.get(id),
                Option.map(
                  previousButtonModel =>
                    [
                      id,
                      new PhysicalButtonModel(
                        physicalButtonPressState,
                        previousButtonModel.assignedToParamButton,
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
            HashMap.set(id, latestButtonModel),
          ),
        { concurrency: 1 },
      ),
      Effect.succeed,
      // Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
    )

    const inputBus = yield* inputBusWriterEffect
    yield* inputBus.publish({
      mapChanges,
      latestPresses: latestPhysicalButtonModelsStream,
    })
  })
