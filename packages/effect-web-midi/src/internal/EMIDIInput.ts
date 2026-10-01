import type * as Brand from 'effect/Brand'
import type * as Stream from 'effect/Stream'

import * as EMIDIPort from './EMIDIPort.ts'
import * as StreamMaker from './StreamMaker.ts'
import * as Util from './Util.ts'

// TODO: implement scoping of midi access that will clean up all message queues
// and streams, and remove listeners

// TODO: implement scope inheritance

/**
 * Thin wrapper around {@linkcode MIDIInput} instance. Will be seen in all
 * external code.
 */
export interface EMIDIInput extends EMIDIPort.EMIDIPort<'input'> {}

/**
 * Thin wrapper around {@linkcode MIDIInput} instance giving access to the
 * actual field storing it.
 * @internal
 */
interface EMIDIInputImpl extends EMIDIPort.EMIDIPortImpl<MIDIInput, 'input'> {}

/**
 * Validates the raw MIDI input port, and puts it into a field hidden from the
 * client's code
 *
 * @internal
 */
const makeImpl = (rawInput: MIDIInput): EMIDIInputImpl =>
  EMIDIPort.makeImpl(rawInput, 'input', globalThis.MIDIInput)

/**
 * Asserts an object to be valid EMIDIInput and casts it to internal
 * implementation type
 *
 * @internal
 */
const assertImpl = (input: unknown) => {
  if (!isImpl(input)) throw new Error('Failed to cast to EMIDIInputImpl')
  return input
}

/**
 * Asserts an object to be valid EMIDIInput
 */
export const assert: (input: unknown) => EMIDIInput = assertImpl

/**
 * @internal
 */
const assumeImpl = (input: EMIDIInput) => input as EMIDIInputImpl

/**
 *
 *
 * @internal
 */
export const make: (rawInput: MIDIInput) => EMIDIInput = makeImpl

/**
 *
 *
 * @internal
 */
const isImpl: (input: unknown) => input is EMIDIInputImpl =
  EMIDIPort.isImplOfSpecificType('input', globalThis.MIDIInput)

/**
 *
 *
 */
export const is: (input: unknown) => input is EMIDIInput = isImpl

/**
 * Dual constructor of {@linkcode MessagesStream}. Dogfoods
 * {@linkcode MessagesContainer} so the container alias cannot go stale.
 */
export interface DualMakeMessagesStream
  extends StreamMaker.DualStreamMaker<
    EMIDIInput,
    'MIDIMessage',
    MessagesContainer
  > {}

/**
 * [MIDIMessageEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIMessageEvent)
 *
 * MIDI spec says that synthetically built `MIDIMessageEvent`s can have `data`
 * field equal to `null`, but when coming from the browser, they won't. The
 * default behavior is to defect on `null`.
 */
export const makeMessagesStreamByPort: DualMakeMessagesStream =
  StreamMaker.createStreamMakerFrom<MIDIInputEventMap>()(
    is,
    input => ({
      tag: 'MIDIMessage',
      eventListener: { target: assumeImpl(input)._port, type: 'midimessage' },
      spanAttributes: {
        spanTargetName: 'MIDI port',
        port: Util.getStaticMIDIPortInfo(input),
      },
      nullableFieldName: 'data',
    }),
    (midiMessage): MessagesContainer => ({ midiMessage }),
  )

/**
 *
 *
 */
export type PolymorphicInput<E, R> = EMIDIPort.PolymorphicPort<E, R, 'input'>

/**
 *
 *
 */
export type PolymorphicInputClean = EMIDIPort.PolymorphicPortClean<'input'>

// export interface AsId extends Brand.Constructor, Struct.Lambda {}

export type Id = EMIDIPort.Id<'input'>
export const Id = EMIDIPort.BothId as Brand.Constructor<Id>

export interface InputIdToInstanceMap extends Record<Id, EMIDIInput> {}

/**
 * Raw event payload remapped into the success channel of
 * {@linkcode makeMessagesStreamByPort}. Derived from the DOM type so it stays
 * in sync with `MIDIInputEventMap`.
 */
export interface MessagesContainer {
  readonly midiMessage: MIDIInputEventMap['midimessage']['data']
}

/**
 * Single element of {@linkcode MessagesStream}.
 */
export type MessagesValue<
  TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
> = Stream.Success<MessagesStream<TOnNullStrategy>>

/**
 * Failures of {@linkcode MessagesStream}. `E` is the error of acquiring the
 * input port (e.g. {@linkcode MIDIErrors.PortNotFoundError} when looked up by id).
 */
export type MessagesError<
  TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
  E = never,
> = Stream.Error<MessagesStream<TOnNullStrategy, E>>

/**
 * Stream of `midimessage` events of a single MIDI input.
 *
 * Generalizes over the null-handling strategy, acquisition error and
 * requirements, so deferred/optional-access services can reuse it instead of
 * re-deriving it via `ReturnType` + `Stream.Success` / `Stream.Error`.
 */
export interface MessagesStream<
  TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
  E = never,
  R = never,
> extends StreamMaker.BuiltStream<
    'MIDIMessage',
    EMIDIInput,
    MessagesContainer,
    TOnNullStrategy,
    E,
    R
  > {}
