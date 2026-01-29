/**
 * @file This module is not for general use, these are just helpers to test the
 * MIDI API with the only MIDI device I have: nanoPAD v1
 */

import * as Stream from 'effect/Stream'

import type * as EMIDIInput from './EMIDIInput.ts'

//? NOTE: Look at the issue https://github.com/WebAudio/web-midi-api/issues/179
// which discusses higher-level MIDI message access

/**
 *
 * @param self
 * @returns
 */
export const withParsedDataField = <A extends MIDIMessage, E, R>(
  self: Stream.Stream<A, E, R>,
): Stream.Stream<ParsedMIDIMessage, E, R> =>
  Stream.map(self, ({ midiMessage, ...obj }) => ({
    ...obj,
    _tag: 'ParsedMIDIMessage',
    midiMessage: parseMIDIMessagePayload(midiMessage),
  }))

/**
 *
 * @param self
 * @returns
 */
export const withTouchpadPositionUpdates = <
  A extends {
    midiMessage:
      | ControlChangePayload
      | TouchpadReleasePayload
      | PitchBendChangePayload
      | { _tag: string & {} }
  },
  E,
  R,
>(
  self: Stream.Stream<A, E, R>,
): Stream.Stream<
  | A
  | (Omit<A, 'midiMessage'> & {
      readonly midiMessage: TouchpadPositionUpdatePayload
    }),
  E,
  R
> =>
  Stream.mapAccum(
    self,
    { x: null as number | null, y: null as number | null },
    (ctx, current) => {
      const { midiMessage, ...rest } = current
      const state = isControlChangePayload(midiMessage)
        ? { ...ctx, y: midiMessage.value }
        : isPitchBendChangePayload(midiMessage)
          ? { ...ctx, x: midiMessage.value }
          : midiMessage._tag === 'Touchpad Release'
            ? { x: null, y: null }
            : ctx

      return [
        state,
        state.x !== null && state.y !== null
          ? Stream.make(current, {
              ...rest,
              midiMessage: {
                _tag: 'Touchpad Position Update' as const,
                x: state.x,
                y: state.y,
              } satisfies TouchpadPositionUpdatePayload,
            })
          : Stream.succeed(current),
      ]
    },
  ).pipe(Stream.flatten())

export type DefaultParsedMIDIMessagePayload =
  | NoteReleasePayload
  | NotePressPayload
  | UnknownReplyPayload
  | ControlChangePayload
  | ChannelPressurePayload
  | TouchpadReleasePayload
  | PitchBendChangePayload

export interface MIDIMessage {
  readonly _tag: 'MIDIMessage'
  readonly cameFrom: EMIDIInput.EMIDIInput
  readonly capturedAt: Date
  readonly midiMessage: Uint8Array<ArrayBuffer>
}

export interface ParsedMIDIMessage<
  Payload extends TaggedObject = DefaultParsedMIDIMessagePayload,
> {
  readonly _tag: 'ParsedMIDIMessage'
  readonly cameFrom: EMIDIInput.EMIDIInput
  readonly capturedAt: Date
  readonly midiMessage: Payload
}

function parseMIDIMessagePayload(
  rawPayload: Uint8Array<ArrayBuffer>,
): DefaultParsedMIDIMessagePayload {
  const unknown = () => {
    let stack = ''
    if (
      'stackTraceLimit' in Error &&
      'captureStackTrace' in Error &&
      typeof Error.captureStackTrace === 'function'
    ) {
      const { stackTraceLimit } = Error
      Error.stackTraceLimit = 4
      const stackHolder = {} as { stack: string }
      Error.captureStackTrace(stackHolder)
      Error.stackTraceLimit = stackTraceLimit
      stack = stackHolder.stack ?? new Error().stack ?? ''
    }
    const result = {
      _tag: 'Unknown Reply' as const,
      unexpectedData: rawPayload.toString(),
      stack,
    }
    return result
  }

  const status = rawPayload.at(0)
  if (status === undefined) return unknown()

  const second = rawPayload.at(1)
  if (second === undefined) return unknown()

  const code = status >> 4
  const channel = status & 0b1111

  if (rawPayload.length === 2) {
    if (code === 0xd)
      return { _tag: 'Channel Pressure', channel, velocity: second }
  }

  if (rawPayload.length !== 3) return unknown()

  const third = rawPayload.at(2)
  if (third === undefined) return unknown()

  if (code === 0x8)
    return { _tag: 'Note Release', channel, note: second, velocity: third }

  if (code === 0x9) {
    if (third === 0)
      return { _tag: 'Note Release', channel, note: second, velocity: 64 }
    return { _tag: 'Note Press', channel, note: second, velocity: third }
  }

  if (code === 0xb)
    return { _tag: 'Control Change', channel, control: second, value: third }

  if (code === 0xe) {
    if (second === 0 && third === 0x40)
      return { _tag: 'Touchpad Release', channel }

    if (second === third)
      return { _tag: 'Pitch Bend Change', channel, value: second }

    return unknown()
  }

  return unknown()
}

const isSpecificPayload =
  <Payload extends TaggedObject>(tag: Payload['_tag']) =>
  (e: TaggedObject): e is Payload =>
    e._tag === tag

export interface MessagePredicate<Payload extends TaggedObject> {
  (m: ParsedMIDIMessage<TaggedObject>): m is ParsedMIDIMessage<Payload>
}

const isSpecificMessage =
  <Payload extends TaggedObject>(
    isSpecificPayload: (e: TaggedObject) => e is Payload,
  ): MessagePredicate<Payload> =>
  (m): m is ParsedMIDIMessage<Payload> =>
    isSpecificPayload(m.midiMessage)

export type TaggedObject = { readonly _tag: string }

/////////////////////////////////////////////

export interface UnknownReplyPayload
  extends Readonly<{
    _tag: 'Unknown Reply'
    unexpectedData: string
    stack: string
  }> {}

export const isUnknownReplyPayload =
  isSpecificPayload<UnknownReplyPayload>('Unknown Reply')

export const isUnknownReply = isSpecificMessage(isUnknownReplyPayload)

/////////////////////////////////////////////

export interface NotePressPayload
  extends Readonly<{
    _tag: 'Note Press'
    channel: number
    note: number
    velocity: number
  }> {}

export const isNotePressPayload =
  isSpecificPayload<NotePressPayload>('Note Press')

export const isNotePress = isSpecificMessage(isNotePressPayload)

/////////////////////////////////////////////

export interface ChannelPressurePayload
  extends Readonly<{
    _tag: 'Channel Pressure'
    channel: number
    velocity: number
  }> {}

export const isChannelPressurePayload =
  isSpecificPayload<ChannelPressurePayload>('Channel Pressure')

export const isChannelPressure = isSpecificMessage(isChannelPressurePayload)

/////////////////////////////////////////////

export interface NoteReleasePayload
  extends Readonly<{
    _tag: 'Note Release'
    channel: number
    note: number
    velocity: number
  }> {}

export const isNoteReleasePayload =
  isSpecificPayload<NoteReleasePayload>('Note Release')

export const isNoteRelease = isSpecificMessage(isNoteReleasePayload)

/////////////////////////////////////////////

export interface ControlChangePayload
  extends Readonly<{
    _tag: 'Control Change'
    channel: number
    control: number
    value: number
  }> {}

export const isControlChangePayload =
  isSpecificPayload<ControlChangePayload>('Control Change')

export const isControlChange = isSpecificMessage(isControlChangePayload)

/////////////////////////////////////////////

export interface TouchpadReleasePayload
  extends Readonly<{ _tag: 'Touchpad Release'; channel: number }> {}

export const isTouchpadReleasePayload =
  isSpecificPayload<TouchpadReleasePayload>('Touchpad Release')

export const isTouchpadRelease = isSpecificMessage(isTouchpadReleasePayload)

/////////////////////////////////////////////

export interface PitchBendChangePayload
  extends Readonly<{
    _tag: 'Pitch Bend Change'
    channel: number
    value: number
  }> {}

export const isPitchBendChangePayload =
  isSpecificPayload<PitchBendChangePayload>('Pitch Bend Change')

export const isPitchBendChange = isSpecificMessage(isPitchBendChangePayload)

/////////////////////////////////////////////

export interface TouchpadPositionUpdatePayload
  extends Readonly<{
    _tag: 'Touchpad Position Update'
    x: number
    y: number
  }> {}

export const isTouchpadPositionUpdatePayload =
  isSpecificPayload<TouchpadPositionUpdatePayload>('Touchpad Position Update')

export const isTouchpadPositionUpdate = isSpecificMessage(
  isTouchpadPositionUpdatePayload,
)
