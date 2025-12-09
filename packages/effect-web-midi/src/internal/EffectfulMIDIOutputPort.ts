/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import {
  CantSendSysexMessagesError,
  MalformedMidiMessageError,
  ClearingSendingQueueIsNotSupportedError,
  DisconnectedPortError,
  remapErrorByName,
} from './errors.ts'
import {
  fromPolymorphic,
  getStaticMIDIPortInfo,
  type PolymorphicEffect,
  polymorphicCheckInDual,
  type SentMessageEffectFrom,
} from './util.ts'

/**
 * Thin wrapper around {@linkcode MIDIOutput} instance. Will be seen in all of
 * the external code.
 */
export interface EffectfulMIDIOutputPort
  extends EffectfulMIDIPort.EffectfulMIDIPort<'output'> {}

/**
 * Thin wrapper around {@linkcode MIDIOutput} instance giving access to the
 * actual field storing it.
 * @internal
 */
interface EffectfulMIDIOutputPortImpl
  extends EffectfulMIDIPort.EffectfulMIDIPortImpl<MIDIOutput, 'output'> {}

/**
 * Validates the raw MIDI output port, and puts it into a field hidden from the
 * client's code
 *
 * @internal
 */
const makeImpl = (rawOutputPort: MIDIOutput): EffectfulMIDIOutputPortImpl =>
  EffectfulMIDIPort.makeImpl(rawOutputPort, 'output', MIDIOutput)

/**
 * Asserts an object to be valid EffectfulMIDIOutputPort and casts it to
 * internal implementation type
 *
 * @internal
 */
const assertImpl = (outputPort: unknown) => {
  if (!isImpl(outputPort))
    throw new Error('Assertion failed: Not a EffectfulMIDIOutputPortImpl')
  return outputPort
}

/**
 * Asserts an object to be valid EffectfulMIDIOutputPort
 */
export const assert: (outputPort: unknown) => EffectfulMIDIOutputPort =
  assertImpl

/**
 * Casts
 * @internal
 */
const assumeImpl = (outputPort: EffectfulMIDIOutputPort) =>
  outputPort as EffectfulMIDIOutputPortImpl

/**
 *
 * @internal
 */
export const make: (rawOutputPort: MIDIOutput) => EffectfulMIDIOutputPort =
  makeImpl

/**
 *
 * @internal
 */
const isImpl = EffectfulMIDIPort.isImplOfSpecificType('output', MIDIOutput)

/**
 *
 */
export const is: (
  outputPort: unknown,
) => outputPort is EffectfulMIDIOutputPort = isImpl

/**
 *
 */
export const makeStateChangesStream =
  EffectfulMIDIPort.makeStateChangesStream as EffectfulMIDIPort.DualMakeStateChangesStream<'output'>

/**
 *
 */
export const matchConnectionState =
  EffectfulMIDIPort.matchMutableMIDIPortProperty('connection', is)

/**
 *
 */
export const matchDeviceState = EffectfulMIDIPort.matchMutableMIDIPortProperty(
  'state',
  is,
)

/**
 * If `midiMessage` is a System Exclusive message, and the `MIDIAccess` did not
 * enable System Exclusive access, an `InvalidAccessError` exception will be
 * thrown
 *
 * If the port is `"connected"` but the connection is `"closed"`, asynchronously
 * tries to open the port. It's unclear in the spec if potential error of `open`
 * call would result in an `InvalidAccessError` error coming from the `send`
 * method itself.
 *
 * @returns An effect with the same port for easier chaining of operations
 */
export const send: DualSendMIDIMessageFromPort = dual<
  SendMIDIMessagePortLast,
  SendMIDIMessagePortFirst
>(
  polymorphicCheckInDual(is),
  Effect.fn('EffectfulMIDIOutputPort.send')(
    function* (polymorphicOutputPort, midiMessage, timestamp) {
      const outputPort = yield* fromPolymorphic(polymorphicOutputPort, is)

      yield* Effect.annotateCurrentSpan({
        midiMessage,
        timestamp,
        port: getStaticMIDIPortInfo(outputPort),
      })

      yield* Effect.try({
        try: () => assumeImpl(outputPort)._port.send(midiMessage, timestamp),
        catch: remapErrorByName(
          {
            InvalidAccessError: CantSendSysexMessagesError,

            // 🤞🏻 https://github.com/WebAudio/web-midi-api/pull/278
            NotAllowedError: CantSendSysexMessagesError,

            InvalidStateError: DisconnectedPortError,
            TypeError: MalformedMidiMessageError,
          },
          'EffectfulMIDIOutputPort.send error handling absurd',
        ),
      })

      return outputPort as EffectfulMIDIOutputPort
    },
  ),
)

export type SendFromPortArgs = [
  midiMessage: Iterable<number>,
  timestamp?: DOMHighResTimeStamp,
]

export interface DualSendMIDIMessageFromPort
  extends SendMIDIMessagePortLast,
    SendMIDIMessagePortFirst {}

export interface SendMIDIMessagePortLast {
  /**
   *
   */
  (
    ...args: SendFromPortArgs
  ): {
    /**
     *
     */
    <E = never, R = never>(
      polymorphicOutputPort: PolymorphicEffect<EffectfulMIDIOutputPort, E, R>,
    ): SentMessageEffectFromPort<E, R>
  }
}

export interface SendMIDIMessagePortFirst {
  /**
   *
   */
  <E = never, R = never>(
    polymorphicOutputPort: PolymorphicEffect<EffectfulMIDIOutputPort, E, R>,
    ...args: SendFromPortArgs
  ): SentMessageEffectFromPort<E, R>
}

/**
 *
 */
export interface SentMessageEffectFromPort<E = never, R = never>
  extends SentMessageEffectFrom<EffectfulMIDIOutputPort, E, R> {}

/**
 * Clears any enqueued send data that has not yet been sent from the
 * `MIDIOutput`'s queue. The browser will ensure the MIDI stream is left in a
 * good state, and if the output port is in the middle of a sysex message, a
 * sysex termination byte (`0xf7`) will be sent.
 *
 * @param polymorphicOutputPort An effectful output port
 *
 * @returns An effect with the same port for easier chaining of operations
 * @experimental Supported only in Firefox. {@link https://caniuse.com/mdn-api_midioutput_clear|Can I use - MIDIOutput API: clear}
 * @see {@link https://www.w3.org/TR/webmidi/#dom-midioutput-clear|WebMIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/MIDIOutput/clear|MDN reference}
 */
export const clear = Effect.fn('EffectfulMIDIOutputPort.clear')(function* <
  E = never,
  R = never,
>(polymorphicOutputPort: PolymorphicEffect<EffectfulMIDIOutputPort, E, R>) {
  const outputPort = yield* fromPolymorphic(polymorphicOutputPort, is)

  yield* Effect.annotateCurrentSpan({ port: getStaticMIDIPortInfo(outputPort) })

  yield* Effect.try({
    // @ts-expect-error even though .clear is in spec, the API is not supported in
    // at least 2 major browsers, hence doesn't meet the condition to be be
    // included and is missing in TS's DOM types
    try: () => assumeImpl(outputPort)._port.clear(),
    catch: remapErrorByName(
      {
        // TODO: test this
        // most likely it would be something like `TypeError: Undefined is not a function`
        TypeError: ClearingSendingQueueIsNotSupportedError,
        NotSupportedError: ClearingSendingQueueIsNotSupportedError,
      },
      'EffectfulMIDIOutputPort.clear error handling absurd',
    ),
  })

  return outputPort
})
