import * as Schema from 'effect/Schema'

const ErrorSchema = Schema.Struct({
  name: Schema.NonEmptyTrimmedString,
  message: Schema.NonEmptyTrimmedString,
  stack: Schema.NonEmptyTrimmedString.pipe(
    Schema.optionalWith({ exact: true }),
  ),
  cause: Schema.Unknown.pipe(Schema.optionalWith({ exact: true })),
})

/**
 * Thrown if the document or page is closed due to user navigation.
 */
export class AbortError extends Schema.TaggedError<AbortError>()('AbortError', {
  cause: ErrorSchema,
}) {}

/**
 * Thrown if the underlying system raises any errors.
 */
export class InvalidStateError extends Schema.TaggedError<InvalidStateError>()(
  'InvalidStateError',
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
 * The object does not support the operation or argument. Thrown if the port is
 * unavailable.
 */
export class InvalidAccessError extends Schema.TaggedError<InvalidAccessError>()(
  'InvalidAccessError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown if the user or system denies the application from creating a
 * MIDIAccess object with the requested options, or if the document is not
 * allowed to use the feature (for example, because of a Permission Policy, or
 * because the user previously denied a permission request).
 *
 * SecurityError in MIDI spec was replaced by NotAllowedError.
 */
export class NotAllowedError extends Schema.TaggedError<NotAllowedError>()(
  'NotAllowedError',
  { cause: ErrorSchema },
) {}

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
