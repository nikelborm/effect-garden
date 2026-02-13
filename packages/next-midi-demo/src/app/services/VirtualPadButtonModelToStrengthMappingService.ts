import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'

import { type AllSimple, NotPressed } from '../helpers/ButtonState.ts'
import { makeVirtualButtonTouchStateStream } from '../helpers/makeVirtualButtonTouchStateStream.ts'
import type { Strength } from './UIButtonService.ts'

export class VirtualPadButtonModelToStrengthMappingService extends Effect.Service<VirtualPadButtonModelToStrengthMappingService>()(
  'next-midi-demo/VirtualPadButtonModelToStrengthMappingService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const physicalButtonIdToModelMapRef = yield* Ref.make(
        HashMap.make(
          ['s' as const, new PhysicalButtonModel(NotPressed, 's' as const)],
          ['m' as const, new PhysicalButtonModel(NotPressed, 'm' as const)],
          ['v' as const, new PhysicalButtonModel(NotPressed, 'v' as const)],
        ),
      )

      const currentMap = Ref.get(physicalButtonIdToModelMapRef)

      const buttonPressStream = Stream.map(
        makeVirtualButtonTouchStateStream(new Set(['strength'] as const)),
        ([element, state]) => [element.strength as Strength, state] as const,
      )

      const latestPhysicalButtonModelsStream = buttonPressStream.pipe(
        Stream.mapEffect(
          ([id, physicalButtonPressState]) =>
            Effect.map(
              currentMap,
              EFunction.flow(
                HashMap.get(id),
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
      )

      const mapChanges = Stream.mapEffect(
        latestPhysicalButtonModelsStream,
        ([id, latestButtonModel]) =>
          Ref.updateAndGet(
            physicalButtonIdToModelMapRef,
            HashMap.set(id, latestButtonModel),
          ),
        { concurrency: 1 },
      )

      return { mapChanges, latestPhysicalButtonModelsStream }
    }),
  },
) {}

export class PhysicalButtonModel<AssignedTo> extends Data.Class<{
  buttonPressState: AllSimple
  assignedTo: AssignedTo
}> {
  constructor(buttonPressState: AllSimple, assignedTo: AssignedTo) {
    super({ buttonPressState, assignedTo })
  }
}
