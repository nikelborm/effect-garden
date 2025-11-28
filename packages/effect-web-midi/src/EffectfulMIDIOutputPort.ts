import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import {
  BadMidiMessageError,
  InvalidAccessError,
  InvalidStateError,
  remapErrorByName,
} from './errors.ts'
import { getStaticMIDIPortInfo } from './util.ts'

const makeImpl = (port: MIDIOutput): EffectfulMIDIOutputPortImpl =>
  EffectfulMIDIPort.makeImpl(port, 'output', MIDIOutput)

const asImpl = (port: EffectfulMIDIOutputPort) => {
  if (!isImpl(port))
    throw new Error('Failed to cast to EffectfulMIDIOutputPortImpl')
  return port
}

export const make: (port: MIDIOutput) => EffectfulMIDIOutputPort = makeImpl

const isImpl = EffectfulMIDIPort.isImplOfSpecificType('output', MIDIOutput)

export const is: (
  port: unknown,
) => port is EffectfulMIDIPort.EffectfulMIDIPort<'output'> = isImpl

export interface EffectfulMIDIOutputPort
  extends EffectfulMIDIPort.EffectfulMIDIPort<'output'> {}

/** @internal */
export interface EffectfulMIDIOutputPortImpl
  extends EffectfulMIDIPort.EffectfulMIDIPortImpl<MIDIOutput, 'output'> {}

export const makeStateChangesStream =
  EffectfulMIDIPort.makeStateChangesStream as EffectfulMIDIPort.DualStateChangesStreamMaker<'output'>

export const makeStateChangesStreamFromWrapped =
  EffectfulMIDIPort.makeStateChangesStreamFromWrapped as EffectfulMIDIPort.DualStateChangesStreamMakerFromWrapped<'output'>

/**
 * Returns the port itself for easier chaining of operations on the same port
 */
export type SentMessageEffect<E = never, R = never> = Effect.Effect<
  EffectfulMIDIOutputPort,
  E | InvalidAccessError | InvalidStateError | BadMidiMessageError,
  R
>

// TODO: add documentation
/**
 * If data is a System Exclusive message, and the MIDIAccess did not enable
 * System Exclusive access, an InvalidAccessError exception will be thrown
 *
 * If the port is "connected" but the connection is "closed", asynchronously
 * tries to open the port. It's unclear in the spec if potential error of
 * `open` call would result in an InvalidAccessError error coming from the
 * send method itself.
 *
 * Returns the port itself for easier chaining of operations on the same port
 */
export const send = dual<
  (
    data: Iterable<number>,
    timestamp?: number | undefined,
  ) => (self: EffectfulMIDIOutputPort) => SentMessageEffect,
  (
    self: EffectfulMIDIOutputPort,
    data: Iterable<number>,
    timestamp?: number | undefined,
  ) => SentMessageEffect
>(
  is,
  Effect.fn('EffectfulMIDIOutputPort.send')(
    (
      self: EffectfulMIDIOutputPort,
      data: Iterable<number>,
      timestamp?: DOMHighResTimeStamp,
    ) =>
      Effect.try({
        try: () => asImpl(self)._port.send(data, timestamp),
        catch: remapErrorByName(
          {
            InvalidAccessError,
            InvalidStateError,
            TypeError: BadMidiMessageError,
          },
          'MIDI port open error handling absurd',
        ),
      }).pipe(
        Effect.andThen(
          Effect.annotateCurrentSpan({
            data,
            timestamp,
            port: getStaticMIDIPortInfo(asImpl(self)._port),
          }),
        ),
        Effect.as(self),
      ),
  ),
)

// TODO: add documentation
/**
 * Returns the port itself for easier chaining of operations on the same port
 */
export const sendFromWrapped = dual<
  (
    data: Iterable<number>,
    timestamp?: number | undefined,
  ) => <E, R>(
    self: Effect.Effect<EffectfulMIDIOutputPort, E, R>,
  ) => SentMessageEffect<E, R>,
  <E, R>(
    self: Effect.Effect<EffectfulMIDIOutputPort, E, R>,
    data: Iterable<number>,
    timestamp?: number | undefined,
  ) => SentMessageEffect<E, R>
>(
  Effect.isEffect,
  <E, R>(
    self: Effect.Effect<EffectfulMIDIOutputPort, E, R>,
    data: Iterable<number>,
    timestamp?: number | undefined,
  ) => Effect.flatMap(self, send(data, timestamp)),
)

// TODO: add documentation
// TODO: fix upstream type-signature
/**
 * Returns the port itself for easier chaining of operations on the same port
 */
export const clear = (self: EffectfulMIDIOutputPort) =>
  // @ts-expect-error upstream bug that .clear is missing, because it's definitely in spec
  Effect.sync(() => asImpl(self)._port.clear()).pipe(
    Effect.as(self),
    Effect.withSpan('EffectfulMIDIOutputPort.clear', {
      attributes: {
        port: getStaticMIDIPortInfo(asImpl(self)._port),
      },
    }),
  )

// TODO: add documentation
/**
 * Returns the port itself for easier chaining of operations on the same port
 */
export const clearFromWrapped = <E, R>(
  self: Effect.Effect<EffectfulMIDIOutputPort, E, R>,
) => Effect.flatMap(self, clear)
