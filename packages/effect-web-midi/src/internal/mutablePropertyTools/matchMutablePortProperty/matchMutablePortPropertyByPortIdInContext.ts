import type * as Effect from 'effect/Effect'
import type * as EMIDIAccess from '../../EMIDIAccess.ts'
import type * as EMIDIErrors from '../../EMIDIErrors.ts'
import type * as EMIDIPort from '../../EMIDIPort.ts'
import * as Get from '../../getPortByPortId/getPortByPortIdInContext.ts'
import * as Match from './matchMutablePortPropertyByPort.ts'

/**
 * @internal
 */
const makeMatcherTakingPortIds =
  <
    THighLevelPortType extends MIDIPortType,
    TMIDIPortProperty extends Match.MIDIPortMutableProperty,
  >(
    match: Match.DualMatchPortState<THighLevelPortType, TMIDIPortProperty>,
    getPort: (
      id: EMIDIPort.Id<THighLevelPortType>,
    ) => Effect.Effect<
      EMIDIPort.EMIDIPort<NoInfer<THighLevelPortType>>,
      EMIDIErrors.PortNotFoundError,
      EMIDIAccess.EMIDIAccess
    >,
  ) =>
  <
    TStateCaseToHandlerMap extends Match.StateCaseToHandlerMap<
      TMIDIPortProperty,
      THighLevelPortType,
      TStateCaseToHandlerMap
    >,
  >(
    id: EMIDIPort.Id<THighLevelPortType>,
    stateCaseToHandlerMap: TStateCaseToHandlerMap,
  ) =>
    match(getPort(id), stateCaseToHandlerMap)

/**
 *
 */
export const matchPortConnectionStateByPortIdInContext =
  makeMatcherTakingPortIds(
    Match.matchPortConnectionStateByPort,
    Get.getPortByPortIdInContext,
  )

/**
 *
 */
export const matchInputConnectionStateByPortIdInContext =
  makeMatcherTakingPortIds(
    Match.matchInputConnectionStateByPort,
    Get.getInputByPortIdInContext,
  )

/**
 *
 */
export const matchOutputConnectionStateByPortIdInContext =
  makeMatcherTakingPortIds(
    Match.matchOutputConnectionStateByPort,
    Get.getOutputByPortIdInContext,
  )

/**
 *
 */
export const matchPortDeviceStateByPortIdInContext = makeMatcherTakingPortIds(
  Match.matchPortDeviceStateByPort,
  Get.getPortByPortIdInContext,
)

/**
 *
 */
export const matchInputDeviceStateByPortIdInContext = makeMatcherTakingPortIds(
  Match.matchInputDeviceStateByPort,
  Get.getInputByPortIdInContext,
)

/**
 *
 */
export const matchOutputDeviceStateByPortIdInContext = makeMatcherTakingPortIds(
  Match.matchOutputDeviceStateByPort,
  Get.getOutputByPortIdInContext,
)
