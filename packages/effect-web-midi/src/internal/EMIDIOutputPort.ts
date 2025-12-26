/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as EMIDIPort from './EMIDIPort.ts'
import {
  CantSendSysexMessagesError,
  ClearingSendingQueueIsNotSupportedError,
  DisconnectedPortError,
  MalformedMidiMessageError,
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
 * Thin wrapper around {@linkcode MIDIOutput} instance. Will be seen in all
 * external code.
 */
export interface EMIDIOutputPort extends EMIDIPort.EMIDIPort<'output'> {}

/**
 * Thin wrapper around {@linkcode MIDIOutput} instance giving access to the
 * actual field storing it.
 * @internal
 */
interface EMIDIOutputPortImpl
  extends EMIDIPort.EMIDIPortImpl<MIDIOutput, 'output'> {}

/**
 * Validates the raw MIDI output port, and puts it into a field hidden from the
 * client's code
 *
 * @internal
 */
const makeImpl = (rawOutputPort: MIDIOutput): EMIDIOutputPortImpl =>
  EMIDIPort.makeImpl(rawOutputPort, 'output', globalThis.MIDIOutput)

/**
 * Asserts an object to be valid EMIDIOutputPort and casts it to
 * internal implementation type
 *
 * @internal
 */
const assertImpl = (outputPort: unknown) => {
  if (!isImpl(outputPort))
    throw new Error('Assertion failed: Not a EMIDIOutputPortImpl')
  return outputPort
}

/**
 * Asserts an object to be valid EMIDIOutputPort
 */
export const assert: (outputPort: unknown) => EMIDIOutputPort = assertImpl

/**
 * Casts
 * @internal
 */
const assumeImpl = (outputPort: EMIDIOutputPort) =>
  outputPort as EMIDIOutputPortImpl

/**
 *
 * @internal
 */
export const make: (rawOutputPort: MIDIOutput) => EMIDIOutputPort = makeImpl

/**
 *
 * @internal
 */
const isImpl = EMIDIPort.isImplOfSpecificType('output', globalThis.MIDIOutput)

/**
 *
 */
export const is: (outputPort: unknown) => outputPort is EMIDIOutputPort = isImpl

/**
 *
 *
 * @internal
 */
const resolve = <E = never, R = never>(
  polymorphicPort: PolymorphicOutputPort<E, R>,
) => fromPolymorphic(polymorphicPort, is)

/**
 * If `midiMessage` is a System Exclusive message, and the `MIDIAccess` did not
 * enable System Exclusive access, an `InvalidAccessError` exception will be
 * thrown
 *
 * If the port is `"connected"` and the connection is `"closed"`, asynchronously
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
  Effect.fn('EMIDIOutputPort.send')(
    function* (polymorphicOutputPort, midiMessage, timestamp) {
      const outputPort = yield* resolve(polymorphicOutputPort)

      yield* Effect.annotateCurrentSpan({
        midiMessage,
        timestamp,
        port: getStaticMIDIPortInfo(outputPort),
      })

      yield* Effect.try({
        try: () => assumeImpl(outputPort)._port.send(midiMessage, timestamp),
        catch: remapErrorByName(
          {
            NotAllowedError: CantSendSysexMessagesError,
            // InvalidAccessError is kept for compatibility reason
            // (https://github.com/WebAudio/web-midi-api/pull/278):
            InvalidAccessError: CantSendSysexMessagesError,

            InvalidStateError: DisconnectedPortError,
            TypeError: MalformedMidiMessageError,
          },
          'EMIDIOutputPort.send error handling absurd',
          { portId: outputPort.id, midiMessage: [...midiMessage] },
        ),
      })

      return outputPort as EMIDIOutputPort
    },
  ),
)

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
 * @see {@link https://www.w3.org/TR/webmidi/#dom-midioutput-clear|Web MIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/MIDIOutput/clear|MDN reference}
 */
export const clear = Effect.fn('EMIDIOutputPort.clear')(function* <
  E = never,
  R = never,
>(polymorphicOutputPort: PolymorphicOutputPort<E, R>) {
  const outputPort = yield* resolve(polymorphicOutputPort)

  yield* Effect.annotateCurrentSpan({ port: getStaticMIDIPortInfo(outputPort) })

  yield* Effect.try({
    // @ts-expect-error even though `.clear` is in spec, the API is not
    // supported in at least 2 major browsers, hence doesn't meet the condition
    // to be included into TS's DOM types
    try: () => assumeImpl(outputPort)._port.clear(),
    catch: remapErrorByName(
      {
        // TODO: test this
        // most likely it would be something like `TypeError: Undefined is not a function`
        TypeError: ClearingSendingQueueIsNotSupportedError,
        NotSupportedError: ClearingSendingQueueIsNotSupportedError,
      },
      'EMIDIOutputPort.clear error handling absurd',
      { portId: outputPort.id },
    ),
  })

  return outputPort
})

/**
 *
 *
 */
export type PolymorphicOutputPort<E, R> = PolymorphicEffect<
  EMIDIOutputPort,
  E,
  R
>

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
      polymorphicOutputPort: PolymorphicOutputPort<E, R>,
    ): SentMessageEffectFromPort<E, R>
  }
}

export interface SendMIDIMessagePortFirst {
  /**
   *
   */
  <E = never, R = never>(
    polymorphicOutputPort: PolymorphicOutputPort<E, R>,
    ...args: SendFromPortArgs
  ): SentMessageEffectFromPort<E, R>
}

/**
 *
 */
export interface SentMessageEffectFromPort<E = never, R = never>
  extends SentMessageEffectFrom<EMIDIOutputPort, E, R> {}
