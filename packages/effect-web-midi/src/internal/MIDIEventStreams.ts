import type * as Cause from 'effect/Cause'
import type * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import * as EMIDIAccess from './EMIDIAccess.ts'
import * as EMIDIInput from './EMIDIInput.ts'
import { getInputByPortIdAndAccess } from './getPortByPortId/getPortByPortIdAndAccess.ts'
import * as GetPort from './getPortByPortId/getPortByPortIdInContext.ts'
import type * as MIDIErrors from './MIDIErrors.ts'
import * as Parsing from './Parsing.ts'
import type * as StreamMaker from './StreamMaker.ts'
import * as Util from './Util.ts'

// export const makeSpecificMessageStreamByInputIdAndAccess = <
//   Payload extends Parsing.TaggedObject,
// >(
//   predicate: Parsing.MessagePredicate<Payload>,
// ) => EMIDIInput.makeMessagesStreamByPort

const buildSpecificMessagesStreamByInputIdInContextMaker = <
  Payload extends Parsing.TaggedObject,
>(
  predicate: Parsing.MessagePredicate<Payload>,
) => {
  const makeSpecificMessageStreamByInput =
    buildSpecificMessageStreamByInputMaker(predicate)

  return <const TForbidNullsStrategy extends ForbidNullsStrategy = undefined>(
    id: EMIDIInput.Id,
    options?: StreamMaker.StreamMakerOptions<TForbidNullsStrategy>,
  ) =>
    makeSpecificMessageStreamByInput(
      GetPort.getInputByPortIdInContext(id),
      options,
    )
}

const buildSpecificMessageStreamByInputMaker = <
  Payload extends Parsing.TaggedObject,
>(
  predicate: Parsing.MessagePredicate<Payload>,
): DualMakeSpecificMessageStream<Payload> =>
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

export interface DualMakeSpecificMessageStream<
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

// interface MakeEventStreamByInputIdAndAccess<
//   TPayload extends Parsing.TaggedObject,
// > {
//   <
//     E1 = never,
//     R1 = never,
//     const TForbidNullsStrategy extends StreamMaker.OnNullStrategy = undefined,
//   >(
//     polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E1, R1>,
//     id: EMIDIInput.Id,
//     options?: StreamMaker.StreamMakerOptions<TForbidNullsStrategy>,
//   ): Stream.Stream<
//     Parsing.ParsedMIDIMessage<TPayload>,
//     | E1
//     | MIDIErrors.PortNotFoundError
//     | StreamMaker.StreamError<TForbidNullsStrategy, never>,
//     R1
//   >
// }

// const buildSpecificEventStreamByInputIdAndAccessMaker = <
//   TPayload extends Parsing.TaggedObject,
// >(
//   makeStreamByPort: <
//     E1 = never,
//     R1 = never,
//     const TForbidNullsStrategy extends StreamMaker.OnNullStrategy = undefined,
//   >(
//     polymorphicPort: EMIDIInput.PolymorphicInput<E1, R1>,
//     options?: StreamMaker.StreamMakerOptions<TForbidNullsStrategy>,
//   ) => Stream.Stream<
//     Parsing.ParsedMIDIMessage<TPayload>,
//     StreamMaker.StreamError<TForbidNullsStrategy, E1>,
//     R1
//   >,
// ): MakeEventStreamByInputIdAndAccess<TPayload> =>
//   EFunction.dual<
//     (
//       polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<never, never>,
//       id: EMIDIInput.Id,
//       options?: StreamMaker.StreamMakerOptions<undefined>,
//     ) => Stream.Stream<
//       Parsing.ParsedMIDIMessage<TPayload>,
//       MIDIErrors.PortNotFoundError,
//       never
//     >,
//     <
//       E1 = never,
//       R1 = never,
//       const TForbidNullsStrategy extends StreamMaker.OnNullStrategy = undefined,
//     >(
//       polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E1, R1>,
//       id: EMIDIInput.Id,
//       options?: StreamMaker.StreamMakerOptions<TForbidNullsStrategy>,
//     ) => Stream.Stream<
//       Parsing.ParsedMIDIMessage<TPayload>,
//       | E1
//       | MIDIErrors.PortNotFoundError
//       | StreamMaker.StreamError<TForbidNullsStrategy, never>,
//       R1
//     >
//   >(3, (polymorphicAccess, id, options) =>
//     Effect.map(EMIDIAccess.simplify(polymorphicAccess), access =>
//       makeStreamByPort(getInputByPortIdAndAccess(access, id), options),
//     ).pipe(Stream.unwrap),
//   )

export const makeNoteReleaseStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isNoteRelease)

export const makeNoteReleaseStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(makeNoteReleaseStreamByInput)

export const makeNoteReleaseStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isNoteRelease)

export const makeNotePressStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isNotePress)

export const makeNotePressStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(makeNotePressStreamByInput)

export const makeNotePressStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isNotePress)

export const makeUnknownReplyStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isUnknownReply)

export const makeUnknownReplyStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(makeUnknownReplyStreamByInput)

export const makeUnknownReplyStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isUnknownReply)

export const makeControlChangeStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isControlChange)

export const makeControlChangeStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(
    makeControlChangeStreamByInput,
  )

export const makeControlChangeStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isControlChange)

export const makeChannelPressureStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isChannelPressure)

export const makeChannelPressureStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(
    makeChannelPressureStreamByInput,
  )

export const makeChannelPressureStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isChannelPressure)

export const makeTouchpadReleaseStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isTouchpadRelease)

export const makeTouchpadReleaseStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(
    makeTouchpadReleaseStreamByInput,
  )

export const makeTouchpadReleaseStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isTouchpadRelease)

export const makePitchBendChangeStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isPitchBendChange)

export const makePitchBendChangeStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(
    makePitchBendChangeStreamByInput,
  )

export const makePitchBendChangeStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(Parsing.isPitchBendChange)

export const makeTouchpadPositionUpdateStreamByInput =
  buildSpecificMessageStreamByInputMaker(Parsing.isTouchpadPositionUpdate)

export const makeTouchpadPositionUpdateStreamByInputIdAndAccess =
  buildSpecificEventStreamByInputIdAndAccessMaker(
    makeTouchpadPositionUpdateStreamByInput,
  )

export const makeTouchpadPositionUpdateStreamByInputIdInContext =
  buildSpecificMessagesStreamByInputIdInContextMaker(
    Parsing.isTouchpadPositionUpdate,
  )
