import type * as Effect from 'effect/Effect'
import type * as EMIDIAccess from '../../EMIDIAccess.ts'
import type * as EMIDIPort from '../../EMIDIPort.ts'
import type * as Errors from '../../errors.ts'
import * as Get from '../../getPortByPortId/getPortByPortIdInContext.ts'
import type * as Util from '../../util.ts'
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
      id: Util.MIDIPortId<THighLevelPortType>,
    ) => Effect.Effect<
      EMIDIPort.EMIDIPort<NoInfer<THighLevelPortType>>,
      Errors.PortNotFoundError,
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
    id: Util.MIDIPortId<THighLevelPortType>,
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
export const matchInputPortConnectionStateByPortIdInContext =
  makeMatcherTakingPortIds(
    Match.matchInputPortConnectionStateByPort,
    Get.getInputPortByPortIdInContext,
  )

/**
 *
 */
export const matchOutputPortConnectionStateByPortIdInContext =
  makeMatcherTakingPortIds(
    Match.matchOutputPortConnectionStateByPort,
    Get.getOutputPortByPortIdInContext,
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
export const matchInputPortDeviceStateByPortIdInContext =
  makeMatcherTakingPortIds(
    Match.matchInputPortDeviceStateByPort,
    Get.getInputPortByPortIdInContext,
  )

/**
 *
 */
export const matchOutputPortDeviceStateByPortIdInContext =
  makeMatcherTakingPortIds(
    Match.matchOutputPortDeviceStateByPort,
    Get.getOutputPortByPortIdInContext,
  )
