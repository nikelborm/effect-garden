/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

import * as EMIDIAccess from '../EMIDIAccess.ts'
import type * as EMIDIPort from '../EMIDIPort.ts'
import type * as Get from '../getPortByPortId/getPortByPortIdAndAccess.ts'
import type * as Make from './makeMIDIPortMethodCallerFactory.ts'

/**
 *
 * @internal
 */
export const actOnPort = <
  TTypeOfPortId extends MIDIPortType,
  TPortTypeReturnedFromAccess extends TPortTypeSupportedInActing &
    TTypeOfPortId,
  TPortTypeSupportedInActing extends MIDIPortType,
  TPortGettingError = never,
  TPortGettingRequirement = never,
  TPortActingError = never,
  TPortActingRequirement = never,
>(
  getPortFromAccessAndPortId: Get.GetPortById<
    TPortTypeReturnedFromAccess,
    TTypeOfPortId,
    never,
    never,
    TPortGettingError,
    TPortGettingRequirement
  >,
  act: Make.TouchPort<
    TPortActingError,
    TPortActingRequirement,
    TPortTypeSupportedInActing
  >,
): EMIDIAccess.GetThingByPortId<
  EMIDIAccess.EMIDIAccessInstance,
  TPortTypeReturnedFromAccess,
  never,
  never,
  TPortGettingError | TPortActingError,
  TPortGettingRequirement | TPortActingRequirement
> =>
  EFunction.dual(
    2,
    (polymorphicAccess, portId) =>
      Effect.gen(function* () {
        const access = yield* EMIDIAccess.simplify(polymorphicAccess)

        const port = yield* getPortFromAccessAndPortId(
          access,
          portId as unknown as EMIDIPort.Id<TTypeOfPortId>,
        )

        const actEffect = act(
          port as unknown as EMIDIPort.EMIDIPort<TPortTypeSupportedInActing>,
        )

        yield* actEffect

        return access
      }) as any,
  )
