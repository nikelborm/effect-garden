import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../brandsAndDatas/index.ts'
import type {
  ParamButtonIdData,
  TaggedReadonlyObject,
} from '../brandsAndDatas/ParamButton.ts'
import {
  PhysicalButtonModel,
  type SupportedPhysicalButtonId,
} from '../brandsAndDatas/PhysicalButton.ts'
import type { InputBusWriterHandle } from './InputStreamBus.ts'

export const assignPhysicalButtonGroupToRespectiveParamButtons = <
  TPhysicalButtonId extends SupportedPhysicalButtonId,
  TParamButtonId extends TaggedReadonlyObject,
  R,
  BusR,
>(
  allPhysicalButtonIdsRepresentingPhysicalButtonGroup: readonly TPhysicalButtonId[],
  allParamButtonIdsRepresentedByPhysicalButtonGroup: readonly ParamButtonIdData<TParamButtonId>[],
  physicalButtonPressStream: Stream.Stream<
    readonly [
      id: TPhysicalButtonId,
      physicalButtonPressState: ButtonState.AllSimple,
    ],
    never,
    R
  >,
  inputBusWriterEffect: Effect.Effect<
    InputBusWriterHandle<TPhysicalButtonId, TParamButtonId>,
    never,
    BusR
  >,
) =>
  Effect.gen(function* () {
    if (
      allPhysicalButtonIdsRepresentingPhysicalButtonGroup.length !==
      allParamButtonIdsRepresentedByPhysicalButtonGroup.length
    )
      return yield* Effect.dieMessage(
        'Assertion failed: allEntities.length !== allPhysicalButtonIds.length',
      )

    const physicalButtonIdToModelMapRef = yield* Ref.make(
      HashMap.make(
        ...EArray.zipWith(
          allParamButtonIdsRepresentedByPhysicalButtonGroup,
          allPhysicalButtonIdsRepresentingPhysicalButtonGroup,

          (paramButtonIdThePhysicalButtonIsAssignedTo, physicalButtonId) =>
            [
              physicalButtonId,
              new PhysicalButtonModel(
                ButtonState.NotPressed,
                paramButtonIdThePhysicalButtonIsAssignedTo,
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
          ([physicalButtonId, physicalButtonPressState]) =>
            Effect.map(
              currentMapEffect,
              EFunction.flow(
                HashMap.get(physicalButtonId),
                Option.map(
                  previousButtonModel =>
                    [
                      physicalButtonId,
                      new PhysicalButtonModel(
                        physicalButtonPressState,
                        previousButtonModel.assignedToParamButtonId,
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
