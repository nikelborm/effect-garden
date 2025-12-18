import type * as Effect from 'effect/Effect'
import type * as EffectfulMIDIAccess from '../../../EffectfulMIDIAccess.ts'
import type * as EffectfulMIDIPort from '../../../EffectfulMIDIPort.ts'
import type { PortNotFoundError } from '../../../errors.ts'
import type { MIDIPortId } from '../../../util.ts'
import {
  getInputPortByPortIdInContext,
  getOutputPortByPortIdInContext,
  getPortByPortIdInContext,
} from '../../getPortByPortId/getPortByPortIdInContext.ts'
import {
  type DualMatchPortState,
  type MIDIPortMutableProperty,
  matchInputPortConnectionStateByPort,
  matchInputPortDeviceStateByPort,
  matchOutputPortConnectionStateByPort,
  matchOutputPortDeviceStateByPort,
  matchPortConnectionStateByPort,
  matchPortDeviceStateByPort,
  type StateCaseToHandlerMap,
} from './matchMutablePortPropertyByPort.ts'

/**
 * @internal
 */
const makeMatcherTakingPortIds =
  <
    THighLevelPortType extends MIDIPortType,
    TMIDIPortProperty extends MIDIPortMutableProperty,
  >(
    match: DualMatchPortState<THighLevelPortType, TMIDIPortProperty>,
    getPort: (
      id: MIDIPortId<THighLevelPortType>,
    ) => Effect.Effect<
      EffectfulMIDIPort.EffectfulMIDIPort<NoInfer<THighLevelPortType>>,
      PortNotFoundError,
      EffectfulMIDIAccess.EffectfulMIDIAccess
    >,
  ) =>
  <
    TStateCaseToHandlerMap extends StateCaseToHandlerMap<
      TMIDIPortProperty,
      THighLevelPortType,
      TStateCaseToHandlerMap
    >,
  >(
    id: MIDIPortId<THighLevelPortType>,
    stateCaseToHandlerMap: TStateCaseToHandlerMap,
  ) =>
    match(getPort(id), stateCaseToHandlerMap)

/**
 *
 */
export const matchPortConnectionStateByPortId = makeMatcherTakingPortIds(
  matchPortConnectionStateByPort,
  getPortByPortIdInContext,
)

/**
 *
 */
export const matchInputPortConnectionStateByPortId = makeMatcherTakingPortIds(
  matchInputPortConnectionStateByPort,
  getInputPortByPortIdInContext,
)

/**
 *
 */
export const matchOutputPortConnectionStateByPortId = makeMatcherTakingPortIds(
  matchOutputPortConnectionStateByPort,
  getOutputPortByPortIdInContext,
)

/**
 *
 */
export const matchPortDeviceStateByPortId = makeMatcherTakingPortIds(
  matchPortDeviceStateByPort,
  getPortByPortIdInContext,
)

/**
 *
 */
export const matchInputPortDeviceStateByPortId = makeMatcherTakingPortIds(
  matchInputPortDeviceStateByPort,
  getInputPortByPortIdInContext,
)

/**
 *
 */
export const matchOutputPortDeviceStateByPortId = makeMatcherTakingPortIds(
  matchOutputPortDeviceStateByPort,
  getOutputPortByPortIdInContext,
)
