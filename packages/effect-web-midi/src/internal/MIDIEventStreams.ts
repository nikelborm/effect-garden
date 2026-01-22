import type * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import * as EMIDIAccess from './EMIDIAccess.ts'
import * as EMIDIInput from './EMIDIInput.ts'
import { getInputByPortIdAndAccess } from './getPortByPortId/getPortByPortIdAndAccess.ts'
import type * as MIDIErrors from './MIDIErrors.ts'
import * as Parsing from './Parsing.ts'
import type * as StreamMaker from './StreamMaker.ts'

interface MakeEventStreamByPort<TPayload extends Parsing.TaggedObject> {
  <
    E1 = never,
    R1 = never,
    const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
  >(
    port: EMIDIInput.PolymorphicInput<E1, R1>,
    options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
  ): Stream.Stream<
    Parsing.ParsedMIDIMessage<TPayload>,
    StreamMaker.StreamError<TOnNullStrategy, E1>,
    R1
  >
}

const makeEventStreamByPort = <TPayload extends Parsing.TaggedObject>(
  predicate: (
    e: Parsing.ParsedMIDIMessage<Parsing.TaggedObject>,
  ) => e is Parsing.ParsedMIDIMessage<TPayload>,
): MakeEventStreamByPort<TPayload> =>
  EFunction.dual<
    (
      port: EMIDIInput.PolymorphicInput<never, never>,
      options?: StreamMaker.StreamMakerOptions<undefined>,
    ) => Stream.Stream<Parsing.ParsedMIDIMessage<TPayload>, never, never>,
    <
      E1 = never,
      R1 = never,
      const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
    >(
      port: EMIDIInput.PolymorphicInput<E1, R1>,
      options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
    ) => Stream.Stream<
      Parsing.ParsedMIDIMessage<TPayload>,
      StreamMaker.StreamError<TOnNullStrategy, E1>,
      R1
    >
  >(
    2,
    <
      E1 = never,
      R1 = never,
      const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
    >(
      port: EMIDIInput.PolymorphicInput<E1, R1>,
      options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
    ): Stream.Stream<
      Parsing.ParsedMIDIMessage<TPayload>,
      StreamMaker.StreamError<TOnNullStrategy, E1>,
      R1
    > =>
      EMIDIInput.makeMessagesStreamByPort(port, options).pipe(
        Stream.filterMap(event => {
          if (
            'midiMessage' in event &&
            event.midiMessage instanceof Uint8Array
          ) {
            return Option.some({
              _tag: 'MIDIMessage' as const,
              cameFrom: event.cameFrom,
              capturedAt: event.capturedAt,
              midiMessage: event.midiMessage,
            } satisfies Parsing.MIDIMessage)
          }
          return Option.none()
        }),
        Parsing.withParsedDataField,
        Stream.filterMap(
          (msg): Option.Option<Parsing.ParsedMIDIMessage<TPayload>> => {
            if (predicate(msg)) {
              return Option.some(msg)
            }
            return Option.none()
          },
        ),
      ),
  )

interface MakeEventStreamByInputIdAndAccess<
  TPayload extends Parsing.TaggedObject,
> {
  <
    E1 = never,
    R1 = never,
    const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
  >(
    polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E1, R1>,
    id: EMIDIInput.Id,
    options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
  ): Stream.Stream<
    Parsing.ParsedMIDIMessage<TPayload>,
    | E1
    | MIDIErrors.PortNotFoundError
    | StreamMaker.StreamError<TOnNullStrategy, never>,
    R1
  >
}

const makeEventStreamByInputIdAndAccess = <
  TPayload extends Parsing.TaggedObject,
>(
  makeStreamByPort: <
    E1 = never,
    R1 = never,
    const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
  >(
    polymorphicPort: EMIDIInput.PolymorphicInput<E1, R1>,
    options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
  ) => Stream.Stream<
    Parsing.ParsedMIDIMessage<TPayload>,
    StreamMaker.StreamError<TOnNullStrategy, E1>,
    R1
  >,
): MakeEventStreamByInputIdAndAccess<TPayload> =>
  EFunction.dual<
    (
      polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<never, never>,
      id: EMIDIInput.Id,
      options?: StreamMaker.StreamMakerOptions<undefined>,
    ) => Stream.Stream<
      Parsing.ParsedMIDIMessage<TPayload>,
      MIDIErrors.PortNotFoundError,
      never
    >,
    <
      E1 = never,
      R1 = never,
      const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
    >(
      polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E1, R1>,
      id: EMIDIInput.Id,
      options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
    ) => Stream.Stream<
      Parsing.ParsedMIDIMessage<TPayload>,
      | E1
      | MIDIErrors.PortNotFoundError
      | StreamMaker.StreamError<TOnNullStrategy, never>,
      R1
    >
  >(3, (polymorphicAccess, id, options) =>
    Effect.map(EMIDIAccess.simplify(polymorphicAccess), access =>
      makeStreamByPort(getInputByPortIdAndAccess(access, id), options),
    ).pipe(Stream.unwrap),
  )

interface MakeEventStreamByInputId<TPayload extends Parsing.TaggedObject> {
  <const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined>(
    id: EMIDIInput.Id,
    options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
  ): Stream.Stream<
    Parsing.ParsedMIDIMessage<TPayload>,
    | MIDIErrors.PortNotFoundError
    | StreamMaker.StreamError<TOnNullStrategy, never>,
    EMIDIAccess.EMIDIAccess
  >
}

const makeEventStreamByInputId =
  <TPayload extends Parsing.TaggedObject>(
    makeStreamByPortIdAndAccess: <
      E1 = never,
      R1 = never,
      const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
    >(
      polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E1, R1>,
      id: EMIDIInput.Id,
      options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
    ) => Stream.Stream<
      Parsing.ParsedMIDIMessage<TPayload>,
      | E1
      | MIDIErrors.PortNotFoundError
      | StreamMaker.StreamError<TOnNullStrategy, never>,
      R1
    >,
  ): MakeEventStreamByInputId<TPayload> =>
  (id, options) =>
    makeStreamByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id, options)

export const makeNoteReleaseStreamByPort = makeEventStreamByPort(
  Parsing.isNoteRelease,
)

export const makeNoteReleaseStreamByInputIdAndAccess =
  makeEventStreamByInputIdAndAccess(makeNoteReleaseStreamByPort)

export const makeNoteReleaseStreamByInputId = makeEventStreamByInputId(
  makeNoteReleaseStreamByInputIdAndAccess,
)

export const makeNotePressStreamByPort = makeEventStreamByPort(
  Parsing.isNotePress,
)

export const makeNotePressStreamByInputIdAndAccess =
  makeEventStreamByInputIdAndAccess(makeNotePressStreamByPort)

export const makeNotePressStreamByInputId = makeEventStreamByInputId(
  makeNotePressStreamByInputIdAndAccess,
)

export const makeUnknownReplyStreamByPort = makeEventStreamByPort(
  Parsing.isUnknownReply,
)

export const makeUnknownReplyStreamByInputIdAndAccess =
  makeEventStreamByInputIdAndAccess(makeUnknownReplyStreamByPort)

export const makeUnknownReplyStreamByInputId = makeEventStreamByInputId(
  makeUnknownReplyStreamByInputIdAndAccess,
)

export const makeControlChangeStreamByPort = makeEventStreamByPort(
  Parsing.isControlChange,
)

export const makeControlChangeStreamByInputIdAndAccess =
  makeEventStreamByInputIdAndAccess(makeControlChangeStreamByPort)

export const makeControlChangeStreamByInputId = makeEventStreamByInputId(
  makeControlChangeStreamByInputIdAndAccess,
)

export const makeChannelPressureStreamByPort = makeEventStreamByPort(
  Parsing.isChannelPressure,
)

export const makeChannelPressureStreamByInputIdAndAccess =
  makeEventStreamByInputIdAndAccess(makeChannelPressureStreamByPort)

export const makeChannelPressureStreamByInputId = makeEventStreamByInputId(
  makeChannelPressureStreamByInputIdAndAccess,
)

export const makeTouchpadReleaseStreamByPort = makeEventStreamByPort(
  Parsing.isTouchpadRelease,
)

export const makeTouchpadReleaseStreamByInputIdAndAccess =
  makeEventStreamByInputIdAndAccess(makeTouchpadReleaseStreamByPort)

export const makeTouchpadReleaseStreamByInputId = makeEventStreamByInputId(
  makeTouchpadReleaseStreamByInputIdAndAccess,
)

export const makePitchBendChangeStreamByPort = makeEventStreamByPort(
  Parsing.isPitchBendChange,
)

export const makePitchBendChangeStreamByInputIdAndAccess =
  makeEventStreamByInputIdAndAccess(makePitchBendChangeStreamByPort)

export const makePitchBendChangeStreamByInputId = makeEventStreamByInputId(
  makePitchBendChangeStreamByInputIdAndAccess,
)

export const makeTouchpadPositionUpdateStreamByPort = makeEventStreamByPort(
  Parsing.isTouchpadPositionUpdate,
)

export const makeTouchpadPositionUpdateStreamByInputIdAndAccess =
  makeEventStreamByInputIdAndAccess(makeTouchpadPositionUpdateStreamByPort)

export const makeTouchpadPositionUpdateStreamByInputId =
  makeEventStreamByInputId(makeTouchpadPositionUpdateStreamByInputIdAndAccess)
