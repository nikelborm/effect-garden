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
}) {
  override get message() {
    return `MIDI access request was interrupted by user navigation, likely because the page was closed`
  }
}

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
) {
  override get message() {
    return `Underlying system (OS/browser) raised an error when attempting to open the port`
  }
}

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
) {
  override get message() {
    return `This platform doesn't support Web MIDI API`
  }
}

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
) {
  override get message() {
    return `This platform doesn't support "MIDIOutput.prototype.clear()" method`
  }
}

/**
 * Thrown when attempt to open the port failed because it is unavailable (e.g.
 * is already in use by another process and cannot be opened, or is
 * disconnected).
 *
 * Wraps `DOMException { name: 'InvalidAccessError' | 'NotAllowedError' | 'InvalidStateError' }`
 *
 * @see Web IDL specs: {@link https://webidl.spec.whatwg.org/#invalidaccesserror|InvalidAccessError}, {@link https://webidl.spec.whatwg.org/#notallowederror|NotAllowedError}, {@link https://webidl.spec.whatwg.org/#invalidstateerror|InvalidStateError}
 */
export class CannotOpenUnavailablePortError extends Schema.TaggedError<CannotOpenUnavailablePortError>()(
  'CannotOpenUnavailablePortError',
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
) {
  override get message() {
    return `Cannot open an unavailable port. This might happen when it's already in use by another process or is disconnected`
  }
}

/**
 * Thrown when `.send` operation was called on a disconnected port.
 *
 * Wraps `DOMException { name: 'InvalidStateError' }`
 *
 * @see {@link https://webidl.spec.whatwg.org/#invalidaccesserror|Web IDL spec}
 */
export class CannotSendToDisconnectedPortError extends Schema.TaggedError<CannotSendToDisconnectedPortError>()(
  'CannotSendToDisconnectedPortError',
  {
    cause: ErrorSchema(Schema.Literal('InvalidStateError')),
    portId: PortId,
  },
) {
  override get message() {
    return `Cannot send a MIDI message to a disconnected port`
  }
}

/**
 * Thrown when trying to send system exclusive message from the access handle,
 * that doesn't have this permission
 *
 * Wraps `DOMException { name: 'InvalidAccessError' | 'NotAllowedError' }`
 *
 * @see Web IDL specs: {@link https://webidl.spec.whatwg.org/#invalidaccesserror|InvalidAccessError}, {@link https://webidl.spec.whatwg.org/#notallowederror|NotAllowedError}
 */
export class CannotSendSysexMessageError extends Schema.TaggedError<CannotSendSysexMessageError>()(
  'CannotSendSysexMessageError',
  {
    cause: ErrorSchema(Schema.Literal('InvalidAccessError', 'NotAllowedError')),
    portId: PortId,
  },
) {
  override get message() {
    return `Cannot send a system exclusive MIDI message from a MIDI access handle that wasn't permitted to send such messages`
  }
}

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
) {
  override get message() {
    return `Request to use Web MIDI API with specific options was rejected by the user or their security settings`
  }
}

/**
 * Thrown when data to be sent is not a valid sequence or does not contain a
 * valid MIDI message
 *
 * Wraps `TypeError`
 */
export class MalformedMIDIMessageError extends Schema.TaggedError<MalformedMIDIMessageError>()(
  'MalformedMIDIMessageError',
  {
    cause: ErrorSchema(Schema.Literal('TypeError')),
    portId: PortId,
    midiMessage: Schema.Array(Schema.Int),
  },
) {
  override get message() {
    return `Attempted to send invalid MIDI message (${this.midiMessage.length} bytes)`
  }
}

/**
 * Keep in mind that if port isn't found, it might not mean it's disconnected.
 * For example, virtual ports created by software won't show up in the list of
 * available inputs/outputs of MIDI Access handle with disabled
 * {@linkcode EMIDIAccess.RequestMIDIAccessOptions.software} flag.
 */
export class PortNotFoundError extends Schema.TaggedError<PortNotFoundError>()(
  'PortNotFound',
  { portId: PortId },
) {
  override get message() {
    return `Port with specific ID wasn't found`
  }
}

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
