/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as EFunction from 'effect/Function'
import * as EMIDIAccess from '../EMIDIAccess.ts'
import type * as EMIDIPort from '../EMIDIPort.ts'
import * as Get from '../getPortByPortId/getPortByPortIdAndAccess.ts'
import type * as MIDIErrors from '../MIDIErrors.ts'
import type * as StreamMaker from '../StreamMaker.ts'
import * as Util from '../Util.ts'
import * as Make from './makePortStateChangesStreamByPort.ts'

const wrap = <
  TTypeOfPortId extends MIDIPortType,
  TPortGettingError = never,
  TPortGettingRequirement = never,
>(
  makePortStateChangesStream: Make.DualMakeStateChangesStreamByPort<TTypeOfPortId>,
  getPortFromAccessAndPortId: Get.GetPortById<
    TTypeOfPortId,
    TTypeOfPortId,
    never,
    never,
    TPortGettingError,
    TPortGettingRequirement
  >,
): MakePortStateChangesStreamByIdAndAccess<
  TTypeOfPortId,
  TPortGettingError,
  TPortGettingRequirement
> =>
  EFunction.dual(
    Util.polymorphicCheckInDual(EMIDIAccess.is),
    (polymorphicAccess, id, options) =>
      makePortStateChangesStream(
        getPortFromAccessAndPortId(polymorphicAccess, id),
        options,
      ),
  )

/**
 *
 */
export const makePortStateChangesStreamByPortIdAndAccess = wrap(
  Make.makePortStateChangesStreamByPort,
  Get.getPortByPortIdAndAccess,
)

/**
 *
 */
export const makeInputStateChangesStreamByPortIdAndAccess = wrap(
  Make.makeInputStateChangesStreamByPort,
  Get.getInputByPortIdAndAccess,
)

/**
 *
 */
export const makeOutputStateChangesStreamByPortIdAndAccess = wrap(
  Make.makeOutputStateChangesStreamByPort,
  Get.getOutputByPortIdAndAccess,
)

export interface MakePortStateChangesStreamByIdAndAccess<
  TTypeOfPortId extends MIDIPortType,
  TPortGettingError,
  TPortGettingRequirement,
> extends MakePortStateChangesStreamByIdAccessLast<
      TTypeOfPortId,
      TPortGettingError,
      TPortGettingRequirement
    >,
    MakePortStateChangesStreamByIdAccessFirst<
      TTypeOfPortId,
      TPortGettingError,
      TPortGettingRequirement
    > {}

export interface MakePortStateChangesStreamByIdAccessFirst<
  TTypeOfPortId extends MIDIPortType,
  TPortGettingError,
  TPortGettingRequirement,
> {
  /**
   *
   */
  <
    TAccessError = never,
    TAccessRequirement = never,
    const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
  >(
    polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<
      TAccessError,
      TAccessRequirement
    >,
    id: EMIDIPort.Id<TTypeOfPortId>,
    options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
  ): Make.StateChangesStream<
    TOnNullStrategy,
    TTypeOfPortId,
    MIDIErrors.PortNotFoundError | TAccessError | TPortGettingError,
    TAccessRequirement | TPortGettingRequirement
  >
}

export interface MakePortStateChangesStreamByIdAccessLast<
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
  ): {
    /**
     *
     */
    <TAccessError = never, TAccessRequirement = never>(
      polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<
        TAccessError,
        TAccessRequirement
      >,
    ): Make.StateChangesStream<
      TOnNullStrategy,
      TTypeOfPortId,
      MIDIErrors.PortNotFoundError | TAccessError | TPortGettingError,
      TAccessRequirement | TPortGettingRequirement
    >
  }
}
