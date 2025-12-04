/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import {
  BadMidiMessageError,
  InvalidAccessError,
  InvalidStateError,
  remapErrorByName,
} from './errors.ts'
import {
  fromIsomorphic,
  getStaticMIDIPortInfo,
  type IsomorphicEffect,
  isomorphicCheckInDual,
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
const makeImpl = (port: MIDIOutput): EffectfulMIDIOutputPortImpl =>
  EffectfulMIDIPort.makeImpl(port, 'output', MIDIOutput)

/**
 * Asserts an object to be valid EffectfulMIDIOutputPort and casts it to
 * internal implementation type
 *
 * @internal
 */
const asImpl = (port: EffectfulMIDIOutputPort) => {
  if (!isImpl(port))
    throw new Error('Failed to cast to EffectfulMIDIOutputPortImpl')
  return port
}

/**
 *
 * @internal
 */
export const make: (port: MIDIOutput) => EffectfulMIDIOutputPort = makeImpl

/**
 *
 * @internal
 */
const isImpl = EffectfulMIDIPort.isImplOfSpecificType('output', MIDIOutput)

/**
 *
 */
export const is: (port: unknown) => port is EffectfulMIDIOutputPort = isImpl

/**
 *
 */
export const makeStateChangesStream =
  EffectfulMIDIPort.makeStateChangesStream as EffectfulMIDIPort.DualStateChangesStreamMaker<'output'>

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
 * If midiMessage is a System Exclusive message, and the MIDIAccess did not
 * enable System Exclusive access, an InvalidAccessError exception will be
 * thrown
 *
 * If the port is "connected" but the connection is "closed", asynchronously
 * tries to open the port. It's unclear in the spec if potential error of `open`
 * call would result in an InvalidAccessError error coming from the send method
 * itself.
 *
 * @returns An effect with the same port for easier chaining of operations
 */
export const send: DualMIDIMessageSenderPort = dual<
  MIDIMessageSenderPortLast,
  MIDIMessageSenderPortFirst
>(
  isomorphicCheckInDual(is),
  Effect.fn('EffectfulMIDIOutputPort.send')(
    function* (outputPortIsomorphic, midiMessage, timestamp) {
      const outputPort = yield* fromIsomorphic(outputPortIsomorphic, is)

      yield* Effect.annotateCurrentSpan({
        midiMessage,
        timestamp,
        port: getStaticMIDIPortInfo(outputPort),
      })

      yield* Effect.try({
        try: () => asImpl(outputPort)._port.send(midiMessage, timestamp),
        catch: remapErrorByName(
          {
            InvalidAccessError,
            InvalidStateError,
            TypeError: BadMidiMessageError,
          },
          'EffectfulMIDIOutputPort.send error handling absurd',
        ),
      })

      return outputPort as EffectfulMIDIOutputPort
    },
  ),
)

export interface DualMIDIMessageSenderPort
  extends MIDIMessageSenderPortLast,
    MIDIMessageSenderPortFirst {}

export interface MIDIMessageSenderPortLast {
  /**
   *
   */
  (
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ): {
    /**
     *
     */
    <E = never, R = never>(
      isomorphicOutputPort: IsomorphicEffect<EffectfulMIDIOutputPort, E, R>,
    ): SentMessageEffectFromPort<E, R>
  }
}

export interface MIDIMessageSenderPortFirst {
  /**
   *
   */
  <E = never, R = never>(
    isomorphicOutputPort: IsomorphicEffect<EffectfulMIDIOutputPort, E, R>,
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ): SentMessageEffectFromPort<E, R>
}

/**
 *
 */
export type SentMessageEffectFromPort<
  E = never,
  R = never,
> = SentMessageEffectFrom<EffectfulMIDIOutputPort, E, R>

// TODO: fix upstream type-signature of clear method

/**
 * Clears any enqueued send data that has not yet been sent from the
 * `MIDIOutput`'s queue. The browser will ensure the MIDI stream is left in a
 * good state, and if the output port is in the middle of a sysex message, a
 * sysex termination byte (`0xf7`) will be sent.
 *
 * @param outputPort An effectful output port
 *
 * @returns An effect with the same port for easier chaining of operations
 */
export const clear = Effect.fn('EffectfulMIDIOutputPort.clear')(function* <
  E = never,
  R = never,
>(isomorphicOutputPort: IsomorphicEffect<EffectfulMIDIOutputPort, E, R>) {
  const outputPort = yield* fromIsomorphic(isomorphicOutputPort, is)

  yield* Effect.annotateCurrentSpan({ port: getStaticMIDIPortInfo(outputPort) })

  // @ts-expect-error upstream bug that .clear is missing, because it's definitely in spec
  yield* Effect.sync(() => asImpl(outputPort)._port.clear())

  return outputPort
})
