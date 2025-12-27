import type * as Create from '../createStreamMakerFrom.ts'
import * as Get from '../getPortByPortId/getPortByPortIdInContext.ts'
import type * as Util from '../util.ts'
import * as Make from './makePortStateChangesStreamByPort.ts'

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makePortStateChangesStreamByPortIdInContext = <
  const TOnNullStrategy extends Create.OnNullStrategy = undefined,
>(
  id: Util.MIDIBothPortId,
  options?: Create.StreamMakerOptions<TOnNullStrategy>,
) =>
  Make.makePortStateChangesStreamByPort(
    Get.getPortByPortIdInContext(id),
    options,
  )

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeInputStateChangesStreamByPortIdInContext = <
  const TOnNullStrategy extends Create.OnNullStrategy = undefined,
>(
  id: Util.MIDIInputId,
  options?: Create.StreamMakerOptions<TOnNullStrategy>,
) =>
  Make.makeInputStateChangesStreamByPort(
    Get.getInputByPortIdInContext(id),
    options,
  )

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeOutputStateChangesStreamByPortIdInContext = <
  const TOnNullStrategy extends Create.OnNullStrategy = undefined,
>(
  id: Util.MIDIOutputId,
  options?: Create.StreamMakerOptions<TOnNullStrategy>,
) =>
  Make.makeOutputStateChangesStreamByPort(
    Get.getOutputByPortIdInContext(id),
    options,
  )
