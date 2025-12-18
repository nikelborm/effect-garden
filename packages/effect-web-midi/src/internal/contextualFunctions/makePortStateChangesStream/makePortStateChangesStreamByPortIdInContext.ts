import { flow } from 'effect/Function'
import type {
  OnNullStrategy,
  StreamMakerOptions,
} from '../../createStreamMakerFrom.ts'
import type {
  MIDIBothPortId,
  MIDIInputPortId,
  MIDIOutputPortId,
} from '../../util.ts'
import {
  getInputPortByPortIdInContext,
  getOutputPortByPortIdInContext,
  getPortByPortIdInContext,
} from '../getPortByPortId/getPortByPortIdInContext.ts'
import {
  makeInputPortStateChangesStreamByPort,
  makeOutputPortStateChangesStreamByPort,
  makePortStateChangesStreamByPort,
} from './makePortStateChangesStreamByPort.ts'

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makePortStateChangesStreamByPortIdInContext = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  id: MIDIBothPortId,
  options?: StreamMakerOptions<TOnNullStrategy>,
) => makePortStateChangesStreamByPort(getPortByPortIdInContext(id), options)

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeInputPortStateChangesStreamByPortIdInContext = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  id: MIDIInputPortId,
  options?: StreamMakerOptions<TOnNullStrategy>,
) =>
  makeInputPortStateChangesStreamByPort(
    getInputPortByPortIdInContext(id),
    options,
  )

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeOutputPortStateChangesStreamByPortIdInContext = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  id: MIDIOutputPortId,
  options?: StreamMakerOptions<TOnNullStrategy>,
) =>
  makeOutputPortStateChangesStreamByPort(
    getOutputPortByPortIdInContext(id),
    options,
  )
