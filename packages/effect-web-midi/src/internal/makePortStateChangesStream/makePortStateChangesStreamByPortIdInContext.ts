/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import type * as EMIDIPort from '../../EMIDIPort.ts'
import * as EMIDIAccess from '../EMIDIAccess.ts'
import type * as EMIDIErrors from '../EMIDIErrors.ts'
import type * as StreamMaker from '../StreamMaker.ts'
import * as Make from './makePortStateChangesStreamByPortIdAndAccess.ts'

const wrap =
  <
    TTypeOfPortId extends MIDIPortType,
    TPortGettingError,
    TPortGettingRequirement,
  >(
    makeStream: Make.MakePortStateChangesStreamByIdAndAccess<
      TTypeOfPortId,
      TPortGettingError,
      TPortGettingRequirement
    >,
  ): MakePortStateChangesStreamByPortIdInContext<
    TTypeOfPortId,
    TPortGettingError,
    TPortGettingRequirement
  > =>
  (id, options) =>
    makeStream(EMIDIAccess.EMIDIAccess, id, options)

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makePortStateChangesStreamByPortIdInContext = wrap(
  Make.makePortStateChangesStreamByPortIdAndAccess,
)

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeInputStateChangesStreamByPortIdInContext = wrap(
  Make.makeInputStateChangesStreamByPortIdAndAccess,
)

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeOutputStateChangesStreamByPortIdInContext = wrap(
  Make.makeOutputStateChangesStreamByPortIdAndAccess,
)

interface MakePortStateChangesStreamByPortIdInContext<
  TTypeOfPortId extends MIDIPortType,
  TPortGettingError,
  TPortGettingRequirement,
> {
  /**
   *
   */
  <const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined>(
    id: EMIDIPort.Id<TTypeOfPortId>,
    options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
  ): EMIDIPort.StateChangesStream<
    TOnNullStrategy,
    TTypeOfPortId,
    TPortGettingError | EMIDIErrors.PortNotFoundError,
    TPortGettingRequirement | EMIDIAccess.EMIDIAccess
  >
}
