/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as EMIDIAccess from '../EMIDIAccess.ts'
import type * as EMIDIPort from '../EMIDIPort.ts'
import type {
  GetPortById,
  GetThingByPortId,
} from '../getPortByPortId/getPortByPortIdAndAccess.ts'
import type { MIDIPortId } from '../util.ts'
import type { TouchPort } from './makeMIDIPortMethodCallerFactory.ts'

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
  portGetterFromAccessAndPortId: GetPortById<
    TPortTypeReturnedFromAccess,
    TTypeOfPortId,
    never,
    never,
    TPortGettingError,
    TPortGettingRequirement
  >,
  act: TouchPort<
    TPortActingError,
    TPortActingRequirement,
    TPortTypeSupportedInActing
  >,
): GetThingByPortId<
  EMIDIAccess.EMIDIAccessInstance,
  TPortTypeReturnedFromAccess,
  never,
  never,
  TPortGettingError | TPortActingError,
  TPortGettingRequirement | TPortActingRequirement
> =>
  dual(
    2,
    (polymorphicAccess, portId) =>
      Effect.gen(function* () {
        const access = yield* EMIDIAccess.resolve(polymorphicAccess)

        const port = yield* portGetterFromAccessAndPortId(
          access,
          portId as unknown as MIDIPortId<TTypeOfPortId>,
        )

        const actEffect = act(
          port as unknown as EMIDIPort.EMIDIPort<TPortTypeSupportedInActing>,
        )

        yield* actEffect

        return access
        // biome-ignore lint/suspicious/noExplicitAny: FallbackOnUnknownOrAny backfired a bit, by I don't care about it anymore
      }) as any,
  )
