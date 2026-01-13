/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

import * as EMIDIPort from './EMIDIPort.ts'
import * as MIDIErrors from './MIDIErrors.ts'
import * as Util from './Util.ts'

/**
 * Thin wrapper around {@linkcode MIDIOutput} instance. Will be seen in all
 * external code.
 */
export interface EMIDIOutput extends EMIDIPort.EMIDIPort<'output'> {}

/**
 * Thin wrapper around {@linkcode MIDIOutput} instance giving access to the
 * actual field storing it.
 * @internal
 */
interface EMIDIOutputImpl
  extends EMIDIPort.EMIDIPortImpl<MIDIOutput, 'output'> {}

/**
 * Validates the raw MIDI output port, and puts it into a field hidden from the
 * client's code
 *
 * @internal
 */
const makeImpl = (rawOutput: MIDIOutput): EMIDIOutputImpl =>
  EMIDIPort.makeImpl(rawOutput, 'output', globalThis.MIDIOutput)

/**
 * Asserts an object to be valid EMIDIOutput and casts it to
 * internal implementation type
 *
 * @internal
 */
const assertImpl = (output: unknown) => {
  if (!isImpl(output))
    throw new Error('Assertion failed: Not a EMIDIOutputImpl')
  return output
}

/**
 * Asserts an object to be valid EMIDIOutput
 */
export const assert: (output: unknown) => EMIDIOutput = assertImpl

/**
 * Casts
 * @internal
 */
const assumeImpl = (output: EMIDIOutput) => output as EMIDIOutputImpl

/**
 *
 * @internal
 */
export const make: (rawOutput: MIDIOutput) => EMIDIOutput = makeImpl

/**
 *
 * @internal
 */
const isImpl = EMIDIPort.isImplOfSpecificType('output', globalThis.MIDIOutput)

/**
 *
 */
export const is: (output: unknown) => output is EMIDIOutput = isImpl

/**
 *
 *
 * @internal
 */
const simplify = <E = never, R = never>(
  polymorphicPort: PolymorphicOutput<E, R>,
) => Util.fromPolymorphic(polymorphicPort, is)

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
export const send: DualSendMIDIMessageFromPort = EFunction.dual<
  SendMIDIMessagePortLast,
  SendMIDIMessagePortFirst
>(
  Util.polymorphicCheckInDual(is),
  Effect.fn('EMIDIOutput.send')(
    function* (polymorphicOutput, midiMessage, timestamp) {
      const output = yield* simplify(polymorphicOutput)

      yield* Effect.annotateCurrentSpan({
        midiMessage,
        timestamp,
        port: Util.getStaticMIDIPortInfo(output),
      })

      yield* Effect.try({
        try: () => assumeImpl(output)._port.send(midiMessage, timestamp),
        catch: MIDIErrors.remapErrorByName(
          {
            NotAllowedError: MIDIErrors.CannotSendSysexMessageError,
            // InvalidAccessError is kept for compatibility reason
            // (https://github.com/WebAudio/web-midi-api/pull/278):
            InvalidAccessError: MIDIErrors.CannotSendSysexMessageError,

            InvalidStateError: MIDIErrors.CannotSendToDisconnectedPortError,
            TypeError: MIDIErrors.MalformedMIDIMessageError,
          },
          'EMIDIOutput.send error handling absurd',
          { portId: output.id, midiMessage: [...midiMessage] },
        ),
      })

      return output as EMIDIOutput
    },
  ),
)

/**
 * Clears any enqueued send data that has not yet been sent from the
 * `MIDIOutput`'s queue. The browser will ensure the MIDI stream is left in a
 * good state, and if the output port is in the middle of a sysex message, a
 * sysex termination byte (`0xf7`) will be sent.
 *
 * @param polymorphicOutput An effectful output port
 *
 * @returns An effect with the same port for easier chaining of operations
 * @experimental Supported only in Firefox. {@link https://caniuse.com/mdn-api_midioutput_clear|Can I use - MIDIOutput API: clear}
 * @see {@link https://www.w3.org/TR/webmidi/#dom-midioutput-clear|Web MIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/MIDIOutput/clear|MDN reference}
 */
export const clear = Effect.fn('EMIDIOutput.clear')(function* <
  E = never,
  R = never,
>(polymorphicOutput: PolymorphicOutput<E, R>) {
  const output = yield* simplify(polymorphicOutput)

  yield* Effect.annotateCurrentSpan({
    port: Util.getStaticMIDIPortInfo(output),
  })

  yield* Effect.try({
    // @ts-expect-error even though `.clear` is in spec, the API is not
    // supported in at least 2 major browsers, hence doesn't meet the condition
    // to be included into TS's DOM types
    try: () => assumeImpl(output)._port.clear(),
    catch: MIDIErrors.remapErrorByName(
      {
        // TODO: test this
        // most likely it would be something like `TypeError: Undefined is not a function`
        TypeError: MIDIErrors.ClearingSendingQueueIsNotSupportedError,
        NotSupportedError: MIDIErrors.ClearingSendingQueueIsNotSupportedError,
      },
      'EMIDIOutput.clear error handling absurd',
      { portId: output.id },
    ),
  })

  return output
})

/**
 *
 *
 */
export type PolymorphicOutput<E, R> = EMIDIPort.PolymorphicPort<E, R, 'output'>

/**
 *
 *
 */
export type PolymorphicOutputClean = EMIDIPort.PolymorphicPortClean<'output'>

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
      polymorphicOutput: PolymorphicOutput<E, R>,
    ): SentMessageEffectFromPort<E, R>
  }
}

export interface SendMIDIMessagePortFirst {
  /**
   *
   */
  <E = never, R = never>(
    polymorphicOutput: PolymorphicOutput<E, R>,
    ...args: SendFromPortArgs
  ): SentMessageEffectFromPort<E, R>
}

/**
 *
 */
export interface SentMessageEffectFromPort<E = never, R = never>
  extends Util.SentMessageEffectFrom<EMIDIOutput, E, R> {}

export type Id = EMIDIPort.Id<'output'>
export const Id = Brand.nominal<Id>()

export interface OutputIdToInstanceMap extends Record<Id, EMIDIOutput> {}
