import * as Schema from 'effect/Schema'
import type * as Types from 'effect/Types'
import type * as EMIDIAccess from './EMIDIAccess.ts'
import * as EMIDIPort from './EMIDIPort.ts'

// NOTE: stacks are properly extracted from error instances into structs, while
// decoding

const PortId = Schema.fromBrand(EMIDIPort.BothId)(Schema.NonEmptyTrimmedString)

const ErrorSchema = <TSchema extends Schema.Schema.Any | undefined = undefined>(
  nameSchema?: TSchema,
) =>
  Schema.Struct({
    name: (nameSchema ??
      Schema.NonEmptyTrimmedString) as TSchema extends undefined
      ? typeof Schema.NonEmptyTrimmedString
      : TSchema,
    message: Schema.NonEmptyTrimmedString,
    stack: Schema.NonEmptyTrimmedString.pipe(
      Schema.optionalWith({ exact: true }),
    ),
    cause: Schema.Unknown.pipe(Schema.optionalWith({ exact: true })),
  })

const midiAccessFailureFields = {
  whileAskingForPermissions: Schema.Struct({
    sysex: Schema.optional(Schema.Boolean),
    software: Schema.optional(Schema.Boolean),
  }),
}

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
  {
    cause: ErrorSchema(Schema.Literal('InvalidStateError')),
    ...midiAccessFailureFields,
  },
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
    ...midiAccessFailureFields,
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
  {
    cause: ErrorSchema(Schema.Literal('TypeError', 'NotSupportedError')),
    portId: PortId,
  },
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
    portId: PortId,
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
  {
    cause: ErrorSchema(Schema.Literal('InvalidStateError')),
    portId: PortId,
  },
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
    portId: PortId,
  },
) {}

/**
 * Thrown if the user, the system or their security settings denied the
 * application from creating an {@linkcode EMIDIAccess.EMIDIAccessInstance} object
 * with the requested {@linkcode EMIDIAccess.RequestMIDIAccessOptions|options}, or if the
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
  {
    cause: ErrorSchema(Schema.Literal('NotAllowedError', 'SecurityError')),
    ...midiAccessFailureFields,
  },
) {}

/**
 * Thrown when data to be sent is not a valid sequence or does not contain a
 * valid MIDI message
 *
 * Wraps `TypeError`
 */
export class MalformedMidiMessageError extends Schema.TaggedError<MalformedMidiMessageError>()(
  'MalformedMidiMessageError',
  {
    cause: ErrorSchema(Schema.Literal('TypeError')),
    portId: PortId,
    midiMessage: Schema.Array(Schema.Int),
  },
) {}

/**
 * Keep in mind that if port isn't found, it might not mean it's disconnected.
 * For example, virtual ports created by software won't show up in the list of
 * available inputs/outputs of MIDI Access handle with disabled
 * {@linkcode EMIDIAccess.RequestMIDIAccessOptions.software} flag.
 */
export class PortNotFoundError extends Schema.TaggedError<PortNotFoundError>()(
  'PortNotFound',
  { portId: PortId },
) {}

/**
 *
 * @internal
 */
export const remapErrorByName =
  // biome-ignore lint/suspicious/noExplicitAny: I don't care
    <TErrorClassUnion extends new (arg: any) => Error>(
      map: { [name: string]: TErrorClassUnion },
      absurdMessage: string,
      rest: Omit<
        Types.UnionToIntersection<
          // biome-ignore lint/suspicious/noExplicitAny: I don't care
          TErrorClassUnion extends new (arg: infer P) => any ? P : never
        >,
        'cause'
      >,
    ) =>
    (cause: unknown) => {
      if (!(cause instanceof Error && cause.name in map))
        throw new Error(absurdMessage)
      // biome-ignore lint/style/noNonNullAssertion: Because we checked it above with `cause.name in map`
      const Class = map[cause.name]!
      return new Class({
        cause,
        ...rest,
      }) as InstanceType<TErrorClassUnion>
    }
