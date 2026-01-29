import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

import * as EMIDIAccess from './EMIDIAccess.ts'
import * as EMIDIInput from './EMIDIInput.ts'
import { getInputByPortIdAndAccess } from './getPortByPortId/getPortByPortIdAndAccess.ts'
import type * as MIDIErrors from './MIDIErrors.ts'
import * as Parsing from './Parsing.ts'
import type * as StreamMaker from './StreamMaker.ts'
import * as Util from './Util.ts'

export const buildSpecificEventStreamByInputIdAndAccessMaker = <
  Payload extends Parsing.TaggedObject,
>(
  predicate: Parsing.MessagePredicate<Payload>,
): DualMakeSpecificMessageStreamFromAccess<Payload> => {
  const makeSpecificMessageStreamByInput =
    buildSpecificMessageStreamByInputMaker(predicate)

  return EFunction.dual(
    Util.polymorphicCheckInDual(EMIDIAccess.is),
    (polymorphicAccess, id, options) =>
      makeSpecificMessageStreamByInput(
        getInputByPortIdAndAccess(polymorphicAccess, id),
        options,
      ),
  )
}

const buildSpecificMessagesStreamByInputIdInContextMaker = <
  Payload extends Parsing.TaggedObject,
>(
  predicate: Parsing.MessagePredicate<Payload>,
) => {
  const makeSpecificMessageStreamByAccess =
    buildSpecificEventStreamByInputIdAndAccessMaker(predicate)

  return <const TForbidNullsStrategy extends ForbidNullsStrategy = undefined>(
    id: EMIDIInput.Id,
    options?: StreamMaker.StreamMakerOptions<TForbidNullsStrategy>,
  ) => makeSpecificMessageStreamByAccess(EMIDIAccess.EMIDIAccess, id, options)
}

const buildSpecificMessageStreamByInputMaker = <
  Payload extends Parsing.TaggedObject,
>(
  predicate: Parsing.MessagePredicate<Payload>,
): DualMakeSpecificMessageStreamFromInput<Payload> =>
  EFunction.dual(
    Util.polymorphicCheckInDual(EMIDIInput.is),
    EFunction.flow(
      EMIDIInput.makeMessagesStreamByPort as any,
      Parsing.withParsedDataField,
      Stream.filter(predicate),
    ),
  )

export type ForbidNullsStrategy = Exclude<
  StreamMaker.OnNullStrategy,
  'passthrough'
>

export interface DualMakeSpecificMessageStreamFromInput<
  Payload extends Parsing.TaggedObject,
> extends MakeSpecificMessageStreamInputLast<Payload>,
    MakeSpecificMessageStreamInputFirst<Payload> {}

export interface MakeSpecificMessageStreamInputFirst<
  Payload extends Parsing.TaggedObject,
> {
  <
    E = never,
    R = never,
    const TForbidNullsStrategy extends ForbidNullsStrategy = undefined,
  >(
    polymorphicInput: EMIDIInput.PolymorphicInput<E, R>,
    options?: StreamMaker.StreamMakerOptions<TForbidNullsStrategy>,
  ): MakeSpecificMessageStreamResult<Payload, TForbidNullsStrategy, E, R>
}

export interface MakeSpecificMessageStreamInputLast<
  Payload extends Parsing.TaggedObject,
> {
  <const TForbidNullsStrategy extends ForbidNullsStrategy = undefined>(
    options?: StreamMaker.StreamMakerOptions<TForbidNullsStrategy>,
  ): MakeSpecificMessageStreamInputLastSecondPart<Payload, TForbidNullsStrategy>
}

export interface MakeSpecificMessageStreamInputLastSecondPart<
  Payload extends Parsing.TaggedObject,
  TForbidNullsStrategy extends ForbidNullsStrategy,
> {
  <E = never, R = never>(
    polymorphicInput: EMIDIInput.PolymorphicInput<E, R>,
  ): MakeSpecificMessageStreamResult<Payload, TForbidNullsStrategy, E, R>
}

////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

export interface DualMakeSpecificMessageStreamFromAccess<
  Payload extends Parsing.TaggedObject,
> extends MakeSpecificMessageStreamAccessLast<Payload>,
    MakeSpecificMessageStreamAccessFirst<Payload> {}

export interface MakeSpecificMessageStreamAccessFirst<
  Payload extends Parsing.TaggedObject,
> {
  <
    E = never,
    R = never,
    const TForbidNullsStrategy extends ForbidNullsStrategy = undefined,
  >(
    polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
    id: EMIDIInput.Id,
    options?: StreamMaker.StreamMakerOptions<TForbidNullsStrategy>,
  ): MakeSpecificMessageStreamResult<
    Payload,
    TForbidNullsStrategy,
    E | MIDIErrors.PortNotFoundError,
    R
  >
}

export interface MakeSpecificMessageStreamAccessLast<
  Payload extends Parsing.TaggedObject,
> {
  <const TForbidNullsStrategy extends ForbidNullsStrategy = undefined>(
    id: EMIDIInput.Id,
    options?: StreamMaker.StreamMakerOptions<TForbidNullsStrategy>,
  ): MakeSpecificMessageStreamAccessLastSecondPart<
    Payload,
    TForbidNullsStrategy
  >
}

export interface MakeSpecificMessageStreamAccessLastSecondPart<
  Payload extends Parsing.TaggedObject,
  TForbidNullsStrategy extends ForbidNullsStrategy,
> {
  <E = never, R = never>(
    polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
  ): MakeSpecificMessageStreamResult<
    Payload,
    TForbidNullsStrategy,
    E | MIDIErrors.PortNotFoundError,
    R
  >
}

export interface MakeSpecificMessageStreamResult<
  Payload extends Parsing.TaggedObject,
  TForbidNullsStrategy extends ForbidNullsStrategy,
  E,
  R,
> extends Stream.Stream<
    Parsing.ParsedMIDIMessage<Payload>,
    StreamMaker.StreamError<TForbidNullsStrategy, E>,
    R
  > {}

export const makeNoteReleaseStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isNoteRelease)

export const makeNoteReleaseStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(Parsing.isNoteRelease)

export const makeNoteReleaseStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isNoteRelease)

export const makeNotePressStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isNotePress)

export const makeNotePressStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(Parsing.isNotePress)

export const makeNotePressStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isNotePress)

export const makeUnknownReplyStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isUnknownReply)

export const makeUnknownReplyStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(Parsing.isUnknownReply)

export const makeUnknownReplyStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isUnknownReply)

export const makeControlChangeStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isControlChange)

export const makeControlChangeStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(Parsing.isControlChange)

export const makeControlChangeStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isControlChange)

export const makeChannelPressureStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isChannelPressure)

export const makeChannelPressureStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(Parsing.isChannelPressure)

export const makeChannelPressureStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isChannelPressure)

export const makeTouchpadReleaseStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isTouchpadRelease)

export const makeTouchpadReleaseStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(Parsing.isTouchpadRelease)

export const makeTouchpadReleaseStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isTouchpadRelease)

export const makePitchBendChangeStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isPitchBendChange)

export const makePitchBendChangeStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(Parsing.isPitchBendChange)

export const makePitchBendChangeStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isPitchBendChange)

export const makeTouchpadPositionUpdateStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isTouchpadPositionUpdate)

export const makeTouchpadPositionUpdateStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(
    Parsing.isTouchpadPositionUpdate,
  )

export const makeTouchpadPositionUpdateStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(
    Parsing.isTouchpadPositionUpdate,
  )
