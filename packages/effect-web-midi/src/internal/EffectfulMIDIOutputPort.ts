import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import {
  BadMidiMessageError,
  InvalidAccessError,
  InvalidStateError,
  remapErrorByName,
} from './errors.ts'
import { getStaticMIDIPortInfo, type SentMessageEffectFrom } from './util.ts'

/**
 *
 * @internal
 */
const makeImpl = (port: MIDIOutput): EffectfulMIDIOutputPortImpl =>
  EffectfulMIDIPort.makeImpl(port, 'output', MIDIOutput)

/**
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
export interface EffectfulMIDIOutputPort
  extends EffectfulMIDIPort.EffectfulMIDIPort<'output'> {}

/**
 *
 * @internal
 */
interface EffectfulMIDIOutputPortImpl
  extends EffectfulMIDIPort.EffectfulMIDIPortImpl<MIDIOutput, 'output'> {}

/**
 *
 */
export const makeStateChangesStream =
  EffectfulMIDIPort.makeStateChangesStream as EffectfulMIDIPort.DualStateChangesStreamMaker<'output'>

/**
 *
 */
export const makeStateChangesStreamFromWrapped =
  EffectfulMIDIPort.makeStateChangesStreamFromWrapped as EffectfulMIDIPort.DualStateChangesStreamMakerFromWrapped<'output'>

/**
 * If midiMessage is a System Exclusive message, and the MIDIAccess did not enable
 * System Exclusive access, an InvalidAccessError exception will be thrown
 *
 * If the port is "connected" but the connection is "closed", asynchronously
 * tries to open the port. It's unclear in the spec if potential error of
 * `open` call would result in an InvalidAccessError error coming from the
 * send method itself.
 *
 * @returns An effect with the same port for easier chaining of operations
 */
export const send = dual<
  (
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ) => (outputPort: EffectfulMIDIOutputPort) => SentMessageEffect,
  (
    outputPort: EffectfulMIDIOutputPort,
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ) => SentMessageEffect
>(
  is,
  Effect.fn('EffectfulMIDIOutputPort.send')(function* (
    outputPort: EffectfulMIDIOutputPort,
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ) {
    const rawPort = asImpl(outputPort)._port

    yield* Effect.annotateCurrentSpan({
      midiMessage,
      timestamp,
      port: getStaticMIDIPortInfo(rawPort),
    })

    yield* Effect.try({
      try: () => rawPort.send(midiMessage, timestamp),
      catch: remapErrorByName(
        {
          InvalidAccessError,
          InvalidStateError,
          TypeError: BadMidiMessageError,
        },
        'EffectfulMIDIOutputPort.send error handling absurd',
      ),
    })

    return outputPort
  }),
)

/**
 * @returns An effect with the same port for easier chaining of operations
 */
export const sendFromWrapped = dual<
  (
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ) => <E, R>(
    wrappedOutputPort: Effect.Effect<EffectfulMIDIOutputPort, E, R>,
  ) => SentMessageEffect<E, R>,
  <E, R>(
    wrappedOutputPort: Effect.Effect<EffectfulMIDIOutputPort, E, R>,
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ) => SentMessageEffect<E, R>
>(
  Effect.isEffect,
  <E, R>(
    wrappedOutputPort: Effect.Effect<EffectfulMIDIOutputPort, E, R>,
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ) => Effect.flatMap(wrappedOutputPort, send(midiMessage, timestamp)),
)

/**
 *
 */
export interface SentMessageEffect<E = never, R = never>
  extends SentMessageEffectFrom<EffectfulMIDIOutputPort, E, R> {}

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
export const clear = Effect.fn('EffectfulMIDIOutputPort.clear')(function* (
  outputPort: EffectfulMIDIOutputPort,
) {
  const rawPort = asImpl(outputPort)._port

  yield* Effect.annotateCurrentSpan({
    port: getStaticMIDIPortInfo(rawPort),
  })

  // @ts-expect-error upstream bug that .clear is missing, because it's definitely in spec
  yield* Effect.sync(() => rawPort.clear())

  return outputPort
})

/**
 * Clears any enqueued send data that has not yet been sent from the
 * `MIDIOutput`'s queue. The browser will ensure the MIDI stream is left in a
 * good state, and if the output port is in the middle of a sysex message, a
 * sysex termination byte (`0xf7`) will be sent.
 *
 * @param outputPortWrapped An effect with effectful output port in the success
 * channel
 * @returns An effect with the same port for easier chaining of operations
 */
export const clearFromWrapped = <E, R>(
  outputPortWrapped: Effect.Effect<EffectfulMIDIOutputPort, E, R>,
) => Effect.flatMap(outputPortWrapped, clear)
