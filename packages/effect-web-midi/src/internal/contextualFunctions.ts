/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import { Effect, flow } from 'effect'
import type {
  OnNullStrategy,
  StreamMakerOptions,
} from './createStreamMakerFrom.ts'
import * as EffectfulMIDIAccess from './EffectfulMIDIAccess.ts'
import * as EffectfulMIDIInputPort from './EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from './EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import type { PortNotFoundError } from './errors.ts'
import type {
  MIDIBothPortId,
  MIDIInputPortId,
  MIDIOutputPortId,
  MIDIPortId,
} from './util.ts'
import {
  getInputPortByPortIdInContext,
  getOutputPortByPortIdInContext,
} from './contextualFunctions/getPortByPortId/getPortByPortIdInContext.ts'

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeMessagesStreamByPortId = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  id: MIDIInputPortId,
  options?: StreamMakerOptions<TOnNullStrategy>,
) =>
  EffectfulMIDIInputPort.makeMessagesStream(
    getInputPortByPortIdInContext(id),
    options,
  )

export const sendToPortById = (
  id: MIDIOutputPortId,
  ...args: EffectfulMIDIOutputPort.SendFromPortArgs
) =>
  Effect.asVoid(
    EffectfulMIDIOutputPort.send(getOutputPortByPortIdInContext(id), ...args),
  )

export const clearPortById = flow(
  getOutputPortByPortIdInContext,
  EffectfulMIDIOutputPort.clear,
  Effect.asVoid,
)

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
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
