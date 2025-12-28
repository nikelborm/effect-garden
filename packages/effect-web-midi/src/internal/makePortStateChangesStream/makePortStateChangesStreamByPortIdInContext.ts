import type * as EMIDIInput from '../../EMIDIInput.ts'
import type * as EMIDIOutput from '../../EMIDIOutput.ts'
import type * as EMIDIPort from '../../EMIDIPort.ts'
import * as Get from '../getPortByPortId/getPortByPortIdInContext.ts'
import type * as StreamMaker from '../StreamMaker.ts'
import * as Make from './makePortStateChangesStreamByPort.ts'

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makePortStateChangesStreamByPortIdInContext = <
  const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
>(
  id: EMIDIPort.BothId,
  options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
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
  const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
>(
  id: EMIDIInput.Id,
  options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
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
  const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
>(
  id: EMIDIOutput.Id,
  options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
) =>
  Make.makeOutputStateChangesStreamByPort(
    Get.getOutputByPortIdInContext(id),
    options,
  )
