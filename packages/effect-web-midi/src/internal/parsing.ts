import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'

export const withParsedDataField = <
  A extends { data: Uint8Array<ArrayBuffer> },
  E,
  R,
>(
  self: Stream.Stream<A, E, R>,
) =>
  Stream.map(self, Struct.evolve({ data: dataEntryParser })) as Stream.Stream<
    Omit<A, 'data'> & { readonly data: ParsedMIDIMessages },
    E,
    R
  >

export const withTouchpadPositionUpdates = <
  A extends {
    data:
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
  A | (Omit<A, 'data'> & { readonly data: TouchpadPositionUpdate }),
  E,
  R
> =>
  Stream.mapAccum(
    self,
    { x: 0, y: 0, seenPressedTouchpadEventsInARow: 0 },
    (ctx, current) => {
      const { data, ...rest } = current
      // TODO: use Match.valueTags?
      // Match.valueTags(data, {
      //   'Control Change': e => 'control',
      //   'Pitch Bend Change': () => 'pitch',
      //   'Touchpad Release': () => 0, // resets everything
      // })
      const select = <T>(control: T, pitch: T, previous: T) =>
        ({
          'Control Change': control,
          'Pitch Bend Change': pitch,
          'Touchpad Release': 0, // resets everything
        })[data._tag as string] ?? previous

      const position = {
        x: select(ctx.x, (data as PitchBendChange).value, ctx.x),
        y: select((data as ControlChange).value, ctx.y, ctx.y),
      }

      const seenPressedTouchpadEventsInARow = select(
        ctx.seenPressedTouchpadEventsInARow + 1,
        ctx.seenPressedTouchpadEventsInARow + 1,
        ctx.seenPressedTouchpadEventsInARow,
      )

      return [
        { ...position, seenPressedTouchpadEventsInARow },
        seenPressedTouchpadEventsInARow > 1 &&
        (position.x !== ctx.x || position.y !== ctx.y)
          ? Stream.make(current, {
              ...rest,
              data: {
                _tag: 'Touchpad Position Update' as const,
                ...position,
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

function dataEntryParser(data: Uint8Array<ArrayBuffer>): ParsedMIDIMessages {
  const unknown = () => {
    const { stackTraceLimit } = Error
    Error.stackTraceLimit = 4
    const stackHolder = {} as { stack: string }
    Error.captureStackTrace(stackHolder)
    Error.stackTraceLimit = stackTraceLimit
    const result = {
      _tag: 'Unknown Reply' as const,
      data: data.toString(),
      stack: stackHolder.stack,
    }
    return result
  }
  if (data.length !== 3) return unknown()
  const first = data.at(0)
  if (first === undefined) return unknown()

  const second = data.at(1)
  if (second === undefined) return unknown()

  const third = data.at(2)
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
    data: string
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
