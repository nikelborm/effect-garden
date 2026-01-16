import * as EArray from 'effect/Array'
import type * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Record from 'effect/Record'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'

import type * as MIDIErrors from './MIDIErrors.ts'

export const midiPortStaticFields = [
  'id',
  'name',
  'manufacturer',
  'version',
  'type',
] as const

export type MIDIPortStaticFields = (typeof midiPortStaticFields)[number]

export const getStaticMIDIPortInfo = (
  port: Pick<MIDIPort, MIDIPortStaticFields>,
) => Struct.pick(port, ...midiPortStaticFields)

/**
 * Puts Self into success channel for easier chaining of operations on the same
 * entity
 */
export interface SentMessageEffectFrom<Self, E = never, R = never>
  extends Effect.Effect<
    Self,
    | E
    | MIDIErrors.CannotSendSysexMessageError
    | MIDIErrors.MalformedMIDIMessageError
    | MIDIErrors.CannotSendToDisconnectedPortError,
    R
  > {}

export type PolymorphicEffect<A, E, R> = A | Effect.Effect<A, E, R>

export type FallbackOnUnknownOrAny<TCandidate, Fallback> =
  unknown extends TCandidate
    ? TCandidate extends unknown
      ? Fallback
      : TCandidate
    : TCandidate

export const polymorphicCheckInDual =
  (is: (arg: unknown) => boolean) => (args: IArguments) =>
    Effect.isEffect(args[0]) || is(args[0])

export function fromPolymorphic<A, E = never, R = never>(
  polymorphicValue: PolymorphicEffect<A, E, R>,
  is: (arg: unknown) => arg is NoInfer<A>,
) {
  const check = (value: A) =>
    is(value)
      ? Effect.succeed(value)
      : Effect.dieMessage('Assertion failed on polymorphic value')

  return Effect.isEffect(polymorphicValue)
    ? Effect.flatMap(polymorphicValue, check)
    : check(polymorphicValue)
}

/**
 * @internal
 */
const isEqual =
  <TWideValue extends string, TPropertyName extends string>() =>
  <const TExpectedValue extends TWideValue>(expected: TExpectedValue) =>
  <E, R>(self: Effect.Effect<TWideValue, E, R>) =>
    Effect.map(
      self,
      current =>
        (current === expected) as IsEqualFlag<TPropertyName, TExpectedValue>,
    )

export type IsEqualFlag<
  TPropertyName extends string,
  TExpectedValue extends string,
> = Brand.Branded<boolean, TPropertyName> &
  Brand.Brand<`expectedValue: ${TExpectedValue}`>

export const isCertainDeviceState = isEqual<
  MIDIPortDeviceState,
  'isCertainDeviceState'
>()

export const isCertainConnectionState = isEqual<
  MIDIPortConnectionState,
  'isCertainConnectionState'
>()

export const isDeviceConnected = isCertainDeviceState('connected')
export const isDeviceDisconnected = isCertainDeviceState('disconnected')

export const isConnectionOpen = isCertainConnectionState('open')
export const isConnectionPending = isCertainConnectionState('pending')
export const isConnectionClosed = isCertainConnectionState('closed')

export const mapToGlidingStringLogOfLimitedEntriesCount =
  <A>(
    windowSize: number,
    show: 'latestFirst' | 'oldestFirst',
    objectify: (current: NoInfer<A>) => object,
  ) =>
  <E, R>(self: Stream.Stream<A, E, R>) => {
    if (windowSize < 1) throw new Error('Window size should be greater than 0')

    return Stream.mapAccum(
      self,
      { text: '', entrySizeLog: [] as number[] },
      ({ entrySizeLog: oldLog, text: oldText }, current) => {
        const currMapped =
          EFunction.pipe(
            objectify(current),
            Record.toEntries,
            EArray.map(EArray.join(': ')),
            EArray.join(', '),
          ) + '\n'

        const potentiallyShiftedLog =
          oldLog.length >= windowSize
            ? oldLog.slice(...(show === 'latestFirst' ? [0, -1] : [1]))
            : oldLog

        const potentiallyShiftedText =
          oldLog.length >= windowSize
            ? oldText.slice(
                ...(show === 'latestFirst'
                  ? // biome-ignore lint/style/noNonNullAssertion: oldLog guaranteed to have at least one element by oldLog.length >= windowSize
                    [0, -oldLog.at(-1)!]
                  : // biome-ignore lint/style/noNonNullAssertion: oldLog guaranteed to have at least one element by oldLog.length >= windowSize
                    [oldLog.at(0)!]),
              )
            : oldText

        const text =
          show === 'latestFirst'
            ? currMapped + potentiallyShiftedText
            : potentiallyShiftedText + currMapped

        const entrySizeLog =
          show === 'latestFirst'
            ? [currMapped.length, ...potentiallyShiftedLog]
            : [...potentiallyShiftedLog, currMapped.length]

        return [{ text, entrySizeLog }, text]
      },
    )
  }
