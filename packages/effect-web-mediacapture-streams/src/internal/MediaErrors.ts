import * as Schema from 'effect/Schema'
import type * as Types from 'effect/Types'

// TODO: deduplicate with effect-web-midi
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

// TODO: deduplicate with effect-web-midi
// TODO: Make so that the function also ensures that cause.name is properly matches the field it's assigned from, so that consistency goes both ways
/**
 *
 * @internal
 */
export const remapErrorByName =
  <TErrorClassUnion extends new (arg: any) => Error>(
    map: { [name: string]: TErrorClassUnion },
    absurdMessage: string,
    rest: Omit<
      Types.UnionToIntersection<
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

export class MediaDeviceEnumerationNotSupportedError extends Schema.TaggedError<MediaDeviceEnumerationNotSupportedError>()(
  'MediaDeviceEnumerationNotSupportedError',
  {
    cause: ErrorSchema(
      Schema.Literal('NotSupportedError', 'ReferenceError', 'TypeError'),
    ),
  },
) {}
