/**
 * @file This module is not for general use, these are just helpers to test the
 * MIDI API with the only MIDI device I have: nanoPAD v1
 */

import * as Stream from 'effect/Stream'

//? NOTE: Look at the issue https://github.com/WebAudio/web-midi-api/issues/179
// which discusses higher-level MIDI message access

/**
 *
 * @param self
 * @returns
 */
export const withParsedDataField = <
  A extends { readonly midiMessage: Uint8Array<ArrayBuffer> },
  E,
  R,
>(
  self: Stream.Stream<A, E, R>,
) =>
  Stream.map(self, ({ midiMessage, ...obj }) => ({
    ...obj,
    _tag: 'ParsedMIDIMessage' as const,
    midiMessage: dataEntryParser(midiMessage),
  })) as Stream.Stream<
    Omit<A, 'midiMessage' | '_tag'> & {
      readonly _tag: 'ParsedMIDIMessage'
      readonly midiMessage: ParsedMIDIMessages
    },
    E,
    R
  >

/**
 *
 * @param self
 * @returns
 */
export const withTouchpadPositionUpdates = <
  A extends {
    midiMessage:
      | ControlChange
      | TouchpadRelease
      | PitchBendChange
      | { _tag: string & {} }
  },
  E,
  R,
>(
  self: Stream.Stream<A, E, R>,
): Stream.Stream<
  | A
  | (Omit<A, 'midiMessage'> & { readonly midiMessage: TouchpadPositionUpdate }),
  E,
  R
> =>
  Stream.mapAccum(
    self,
    { x: null as number | null, y: null as number | null },
    (ctx, current) => {
      const { midiMessage, ...rest } = current
      const state = isControlChange(midiMessage)
        ? { ...ctx, y: midiMessage.value }
        : isPitchBendChange(midiMessage)
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
              } satisfies TouchpadPositionUpdate,
            })
          : Stream.succeed(current),
      ]
    },
  ).pipe(Stream.flatten())

export type ParsedMIDIMessages =
  | NoteRelease
  | NotePress
  | UnknownReply
  | ControlChange
  | TouchpadRelease
  | PitchBendChange

function dataEntryParser(
  midiMessage: Uint8Array<ArrayBuffer>,
): ParsedMIDIMessages {
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
      unexpectedData: midiMessage.toString(),
      stack,
    }
    return result
  }
  if (midiMessage.length !== 3) return unknown()
  const first = midiMessage.at(0)
  if (first === undefined) return unknown()

  const second = midiMessage.at(1)
  if (second === undefined) return unknown()

  const third = midiMessage.at(2)
  if (third === undefined) return unknown()

  const code = first >> 4
  const channel = first & 0b1111

  if (code === 0x8) {
    if (third !== 0x40) return unknown()
    return {
      _tag: 'Note Release',
      channel,
      note: second,
    }
  }

  if (code === 0x9) {
    if (third === 0) return unknown()
    return {
      _tag: 'Note Press',
      channel,
      note: second,
      velocity: third,
    }
  }

  if (code === 0xb) {
    return {
      _tag: 'Control Change',
      channel,
      control: second,
      value: third,
    }
  }

  if (code === 0xe) {
    if (second === 0 && third === 0x40)
      return { _tag: 'Touchpad Release', channel }

    if (second === third)
      return { _tag: 'Pitch Bend Change', channel, value: second }
    return unknown()
  }
  return unknown()
}

export const isControlChange = (e: { _tag: string }): e is ControlChange =>
  e._tag === 'Control Change'

export const isPitchBendChange = (e: { _tag: string }): e is PitchBendChange =>
  e._tag === 'Pitch Bend Change'

export interface NoteRelease
  extends Readonly<{ _tag: 'Note Release'; channel: number; note: number }> {}

export interface NotePress
  extends Readonly<{
    _tag: 'Note Press'
    channel: number
    note: number
    velocity: number
  }> {}

export interface UnknownReply
  extends Readonly<{
    _tag: 'Unknown Reply'
    unexpectedData: string
    stack: string
  }> {}

export interface ControlChange
  extends Readonly<{
    _tag: 'Control Change'
    channel: number
    control: number
    value: number
  }> {}

export interface TouchpadRelease
  extends Readonly<{ _tag: 'Touchpad Release'; channel: number }> {}

export interface PitchBendChange
  extends Readonly<{
    _tag: 'Pitch Bend Change'
    channel: number
    value: number
  }> {}

export interface TouchpadPositionUpdate
  extends Readonly<{
    _tag: 'Touchpad Position Update'
    x: number
    y: number
  }> {}
