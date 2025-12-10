import { type Cause, Effect, flow } from 'effect'
import type {
  OnNullStrategy,
  StreamMakerOptions,
} from './createStreamMakerFrom.ts'
import * as EffectfulMIDIAccess from './EffectfulMIDIAccess.ts'
import * as EffectfulMIDIInputPort from './EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from './EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import type {
  MIDIBothPortId,
  MIDIInputPortId,
  MIDIOutputPortId,
  MIDIPortId,
} from './util.ts'

/**
 * @internal
 */
const makeMatcherTakingPortIds =
  <
    TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
    TMIDIPortProperty extends EffectfulMIDIPort.MIDIPortMutableProperty,
  >(
    match: EffectfulMIDIPort.DualMatchPortState<
      TMIDIPortTypeHighLevelRestriction,
      TMIDIPortProperty
    >,
    getPort: (
      id: MIDIPortId<TMIDIPortTypeHighLevelRestriction>,
    ) => Effect.Effect<
      EffectfulMIDIPort.EffectfulMIDIPort<
        NoInfer<TMIDIPortTypeHighLevelRestriction>
      >,
      Cause.NoSuchElementException,
      EffectfulMIDIAccess.EffectfulMIDIAccess
    >,
  ) =>
  <
    TStateCaseToHandlerMap extends EffectfulMIDIPort.StateCaseToHandlerMap<
      TMIDIPortProperty,
      TMIDIPortTypeHighLevelRestriction,
      TStateCaseToHandlerMap
    >,
  >(
    id: MIDIPortId<TMIDIPortTypeHighLevelRestriction>,
    stateCaseToHandlerMap: TStateCaseToHandlerMap,
  ) =>
    match(getPort(id), stateCaseToHandlerMap)

/**
 *
 *
 */
export const getPortByIdFromContext = (id: MIDIBothPortId) =>
  EffectfulMIDIAccess.getPortById(EffectfulMIDIAccess.EffectfulMIDIAccess, id)

/**
 *
 *
 */
export const getInputPortByIdFromContext = (id: MIDIInputPortId) =>
  EffectfulMIDIAccess.getInputPortById(
    EffectfulMIDIAccess.EffectfulMIDIAccess,
    id,
  )

/**
 *
 *
 */
export const getOutputPortByIdFromContext = (id: MIDIOutputPortId) =>
  EffectfulMIDIAccess.getOutputPortById(
    EffectfulMIDIAccess.EffectfulMIDIAccess,
    id,
  )

/**
 *
 */
export const matchPortConnectionStateByPortId = makeMatcherTakingPortIds(
  EffectfulMIDIPort.matchConnectionState,
  getPortByIdFromContext,
)

/**
 *
 */
export const matchInputPortConnectionStateByPortId = makeMatcherTakingPortIds(
  EffectfulMIDIInputPort.matchConnectionState,
  getInputPortByIdFromContext,
)

/**
 *
 */
export const matchOutputPortConnectionStateByPortId = makeMatcherTakingPortIds(
  EffectfulMIDIOutputPort.matchConnectionState,
  getOutputPortByIdFromContext,
)

/**
 *
 */
export const matchPortDeviceStateByPortId = makeMatcherTakingPortIds(
  EffectfulMIDIPort.matchDeviceState,
  getPortByIdFromContext,
)

/**
 *
 */
export const matchInputPortDeviceStateByPortId = makeMatcherTakingPortIds(
  EffectfulMIDIInputPort.matchDeviceState,
  getInputPortByIdFromContext,
)

/**
 *
 */
export const matchOutputPortDeviceStateByPortId = makeMatcherTakingPortIds(
  EffectfulMIDIOutputPort.matchDeviceState,
  getOutputPortByIdFromContext,
)

// TODO: input-specific and output-specific connection openers, closers and acquirers

/**
 *
 */
export const openPortConnectionByPortId = flow(
  getPortByIdFromContext,
  EffectfulMIDIPort.openConnection,
)

/**
 *
 */
export const closePortConnectionByPortId = flow(
  getPortByIdFromContext,
  EffectfulMIDIPort.closeConnection,
)

/**
 *
 */
export const acquireReleasePortConnectionByPortId = flow(
  getPortByIdFromContext,
  EffectfulMIDIPort.acquireReleaseConnection,
)

/**
 * @param options Passing a boolean is equivalent to setting `options.capture`
 * property
 */
export const makePortStateChangesStreamByPortId = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  id: MIDIBothPortId,
  options?: StreamMakerOptions<TOnNullStrategy>,
) =>
  EffectfulMIDIPort.makeStateChangesStream(getPortByIdFromContext(id), options)

/**
 * @param options Passing a boolean is equivalent to setting `options.capture`
 * property
 */
export const makeInputPortStateChangesStreamByPortId = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  id: MIDIInputPortId,
  options?: StreamMakerOptions<TOnNullStrategy>,
) =>
  EffectfulMIDIInputPort.makeStateChangesStream(
    getInputPortByIdFromContext(id),
    options,
  )

/**
 * @param options Passing a boolean is equivalent to setting `options.capture`
 * property
 */
export const makeOutputPortStateChangesStreamByPortId = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  id: MIDIOutputPortId,
  options?: StreamMakerOptions<TOnNullStrategy>,
) =>
  EffectfulMIDIOutputPort.makeStateChangesStream(
    getOutputPortByIdFromContext(id),
    options,
  )

/**
 * @param options Passing a boolean is equivalent to setting `options.capture`
 * property
 */
export const makeMessagesStreamByPortId = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  id: MIDIInputPortId,
  options?: StreamMakerOptions<TOnNullStrategy>,
) =>
  EffectfulMIDIInputPort.makeMessagesStream(
    getInputPortByIdFromContext(id),
    options,
  )

export const sendToPortById = (
  id: MIDIOutputPortId,
  ...args: EffectfulMIDIOutputPort.SendFromPortArgs
) =>
  Effect.asVoid(
    EffectfulMIDIOutputPort.send(getOutputPortByIdFromContext(id), ...args),
  )

export const clearPortById = flow(
  getOutputPortByIdFromContext,
  EffectfulMIDIOutputPort.clear,
  Effect.asVoid,
)

/**
 *
 *
 */
export const getPortDeviceStateByPortId = (id: MIDIBothPortId) =>
  EffectfulMIDIAccess.getPortDeviceState(
    EffectfulMIDIAccess.EffectfulMIDIAccess,
    id,
  )

/**
 *
 *
 */
export const getPortConnectionStateByPortId = (id: MIDIBothPortId) =>
  EffectfulMIDIAccess.getPortConnectionState(
    EffectfulMIDIAccess.EffectfulMIDIAccess,
    id,
  )

/**
 * @param options Passing a boolean is equivalent to setting `options.capture`
 * property
 */
export const makeAllPortsStateChangesStreamFromContext = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  options?: StreamMakerOptions<TOnNullStrategy>,
) =>
  EffectfulMIDIAccess.makeAllPortsStateChangesStream(
    EffectfulMIDIAccess.EffectfulMIDIAccess,
    options,
  )

/**
 *
 *
 */
export const sendFromContext = (
  ...args: EffectfulMIDIAccess.SendFromAccessArgs
) =>
  Effect.asVoid(
    EffectfulMIDIAccess.send(EffectfulMIDIAccess.EffectfulMIDIAccess, ...args),
  )
