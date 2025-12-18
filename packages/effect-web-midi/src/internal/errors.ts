import * as Schema from 'effect/Schema'
import type {
  EffectfulMIDIAccessInstance,
  RequestMIDIAccessOptions,
} from './EffectfulMIDIAccess.ts'

// TODO: add the fields related to the info about which port/access handle the
// error is happened on

// TODO: ensure stacks are preserved in errors (the best option for this would be to write an actual test of course)

const ErrorSchema = <A extends string, E extends string, R>(
  nameSchema?: Schema.Schema<A, E, R>,
) =>
  Schema.Struct({
    name: nameSchema ?? Schema.NonEmptyTrimmedString,
    message: Schema.NonEmptyTrimmedString,
    stack: Schema.NonEmptyTrimmedString.pipe(
      Schema.optionalWith({ exact: true }),
    ),
    cause: Schema.Unknown.pipe(Schema.optionalWith({ exact: true })),
  })

/**
 * Thrown if the document or page is going to be closed due to user navigation.
 *
 * Wraps `DOMException { name: 'AbortError' }`
 *
 * @see {@link https://webidl.spec.whatwg.org/#aborterror|Web IDL spec}
 */
export class AbortError extends Schema.TaggedError<AbortError>()('AbortError', {
  cause: ErrorSchema(Schema.Literal('AbortError')),
}) {}

/**
 * Thrown if the underlying system raises any errors when trying to open the
 * port.
 *
 * Wraps `DOMException { name: 'InvalidStateError' }`
 *
 * @see {@link https://webidl.spec.whatwg.org/#invalidstateerror|Web IDL spec}
 */
export class UnderlyingSystemError extends Schema.TaggedError<UnderlyingSystemError>()(
  'UnderlyingSystemError',
  { cause: ErrorSchema(Schema.Literal('InvalidStateError')) },
) {}

/**
 * Thrown if the MIDI API, or a certain configuration of it is not supported by
 * the system.
 *
 * Wraps `ReferenceError | TypeError | DOMException { name: 'NotSupportedError' }`
 *
 * @see {@link https://webidl.spec.whatwg.org/#notsupportederror|Web IDL spec}
 */
export class MIDIAccessNotSupportedError extends Schema.TaggedError<MIDIAccessNotSupportedError>()(
  'MIDIAccessNotSupportedError',
  {
    cause: ErrorSchema(
      Schema.Literal('ReferenceError', 'TypeError', 'NotSupportedError'),
    ),
  },
) {}

/**
 * Thrown on platforms where `.clear()` method of output ports is not supported
 * (currently supported only in Firefox)
 *
 * Wraps `TypeError | DOMException { name: 'NotSupportedError' }`
 *
 * @see {@link https://webidl.spec.whatwg.org/#notsupportederror|Web IDL spec}
 */
export class ClearingSendingQueueIsNotSupportedError extends Schema.TaggedError<ClearingSendingQueueIsNotSupportedError>()(
  'ClearingSendingQueueIsNotSupportedError',
  { cause: ErrorSchema(Schema.Literal('TypeError', 'NotSupportedError')) },
) {}

/**
 * Thrown when attempt to open the port failed because it is unavailable (e.g.
 * is already in use by another process and cannot be opened, or is
 * disconnected).
 *
 * Wraps `DOMException { name: 'InvalidAccessError' | 'NotAllowedError' | 'InvalidStateError' }`
 *
 * @see Web IDL specs: {@link https://webidl.spec.whatwg.org/#invalidaccesserror|InvalidAccessError}, {@link https://webidl.spec.whatwg.org/#notallowederror|NotAllowedError}, {@link https://webidl.spec.whatwg.org/#invalidstateerror|InvalidStateError}
 */
export class UnavailablePortError extends Schema.TaggedError<UnavailablePortError>()(
  'UnavailablePortError',
  {
    cause: ErrorSchema(
      Schema.Literal(
        'InvalidAccessError',
        'NotAllowedError',
        'InvalidStateError',
      ),
    ),
  },
) {}

/**
 * Thrown when `.send` operation was called on a disconnected port.
 *
 * Wraps `DOMException { name: 'InvalidStateError' }`
 *
 * @see {@link https://webidl.spec.whatwg.org/#invalidaccesserror|Web IDL spec}
 */
export class DisconnectedPortError extends Schema.TaggedError<DisconnectedPortError>()(
  'DisconnectedPortError',
  { cause: ErrorSchema(Schema.Literal('InvalidStateError')) },
) {}

/**
 * Thrown when trying to send system exclusive message from the access handle,
 * that doesn't have this permission
 *
 * Wraps `DOMException { name: 'InvalidAccessError' | 'NotAllowedError' }`
 *
 * @see Web IDL specs: {@link https://webidl.spec.whatwg.org/#invalidaccesserror|InvalidAccessError}, {@link https://webidl.spec.whatwg.org/#notallowederror|NotAllowedError}
 */
export class CantSendSysexMessagesError extends Schema.TaggedError<CantSendSysexMessagesError>()(
  'CantSendSysexMessagesError',
  {
    cause: ErrorSchema(Schema.Literal('InvalidAccessError', 'NotAllowedError')),
  },
) {}

/**
 * Thrown if the user, the system or their security settings denied the
 * application from creating an {@linkcode EffectfulMIDIAccessInstance} object
 * with the requested {@linkcode RequestMIDIAccessOptions|options}, or if the
 * document is not allowed to use the feature (for example, because of a
 * Permission Policy, or because the user previously denied a permission
 * request).
 *
 * Wraps `DOMException { name: 'NotAllowedError' | 'SecurityError' }`
 *
 * @see Web IDL specs: {@link https://webidl.spec.whatwg.org/#notallowederror|NotAllowedError}, {@link https://webidl.spec.whatwg.org/#securityerror|SecurityError}
 */
export class MIDIAccessNotAllowedError extends Schema.TaggedError<MIDIAccessNotAllowedError>()(
  'MIDIAccessNotAllowedError',
  { cause: ErrorSchema(Schema.Literal('NotAllowedError', 'SecurityError')) },
) {}

/**
 * Thrown when data to be sent is not a valid sequence or does not contain a
 * valid MIDI message
 *
 * Wraps `TypeError`
 */
export class MalformedMidiMessageError extends Schema.TaggedError<MalformedMidiMessageError>()(
  'MalformedMidiMessageError',
  { cause: ErrorSchema(Schema.Literal('TypeError')) },
) {}

/**
 * Keep in mind that if port isn't found, it might not mean it's disconnected.
 * For example, virtual ports created by software won't show up in the list of
 * available inputs/outputs of MIDI Access handle with disabled
 * {@linkcode RequestMIDIAccessOptions.software} flag.
 */
export class PortNotFoundError extends Schema.TaggedError<PortNotFoundError>()(
  'PortNotFound',
  { attemptedToGetById: Schema.NonEmptyTrimmedString },
) {}

/**
 *
 * @internal
 */
export const remapErrorByName =
  <
    TErrorNameToTaggedErrorClassMap extends {
      [name: string]: new (arg: {
        cause: Schema.Schema.Encoded<ReturnType<typeof ErrorSchema>>
      }) => Error
    },
  >(
    map: TErrorNameToTaggedErrorClassMap,
    absurdMessage: string,
  ) =>
  (cause: unknown) => {
    if (!(cause instanceof Error && cause.name in map))
      throw new Error(absurdMessage)
    type TErrorClassUnion =
      TErrorNameToTaggedErrorClassMap[keyof TErrorNameToTaggedErrorClassMap]
    const Class = map[cause.name] as TErrorClassUnion
    return new Class({ cause }) as InstanceType<TErrorClassUnion>
  }
