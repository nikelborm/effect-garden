import * as Schema from 'effect/Schema'
import type {
  EffectfulMIDIAccessInstance,
  RequestMIDIAccessOptions,
} from './EffectfulMIDIAccess.ts'

// TODO: add the fields related to the info about which port/access handle the
// error is happened on

const ErrorSchema = Schema.Struct({
  name: Schema.NonEmptyTrimmedString,
  message: Schema.NonEmptyTrimmedString,
  stack: Schema.NonEmptyTrimmedString.pipe(
    Schema.optionalWith({ exact: true }),
  ),
  cause: Schema.Unknown.pipe(Schema.optionalWith({ exact: true })),
})

/**
 * Thrown if the document or page is going to be closed due to user navigation.
 */
export class AbortError extends Schema.TaggedError<AbortError>()('AbortError', {
  cause: ErrorSchema,
}) {}

/**
 * Thrown if the underlying system raises any errors when trying to open the
 * port.
 */
export class UnderlyingSystemError extends Schema.TaggedError<UnderlyingSystemError>()(
  'UnderlyingSystemError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown if the feature or options are not supported by the system.
 */
export class NotSupportedError extends Schema.TaggedError<NotSupportedError>()(
  'NotSupportedError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown when trying the port is unavailable (e.g. is already in use by another
 * process and cannot be opened, or is disconnected).
 */
export class UnavailablePortError extends Schema.TaggedError<UnavailablePortError>()(
  'UnavailablePortError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown when .send operation was called on a disconnected port
 */
export class DisconnectedPortError extends Schema.TaggedError<DisconnectedPortError>()(
  'DisconnectedPortError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown when trying to send system exclusive message from the access handle,
 * that doesn't have this permission
 */
export class AbsentSystemExclusiveMessagesAccessError extends Schema.TaggedError<AbsentSystemExclusiveMessagesAccessError>()(
  'AbsentSystemExclusiveMessagesAccessError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown if the user, the system or their security settings denied the
 * application from creating an {@linkcode EffectfulMIDIAccessInstance} object
 * with the requested {@linkcode RequestMIDIAccessOptions}, or if the document
 * is not allowed to use the feature (for example, because of a Permission
 * Policy, or because the user previously denied a permission request).
 *
 * `SecurityError` in MIDI spec was replaced by {@linkcode NotAllowedError}.
 */
export class NotAllowedError extends Schema.TaggedError<NotAllowedError>()(
  'NotAllowedError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown when data to be sent is not a valid sequence or does not contain a
 * valid MIDI message
 */
export class BadMidiMessageError extends Schema.TaggedError<BadMidiMessageError>()(
  'BadMidiMessageError',
  { cause: ErrorSchema },
) {}

/**
 *
 * @internal
 */
export const remapErrorByName =
  <
    TErrorNameToTaggedErrorClassMap extends {
      [name: string]: new (arg: {
        cause: Schema.Schema.Encoded<typeof ErrorSchema>
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
