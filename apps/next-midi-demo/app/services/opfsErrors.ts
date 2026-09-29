import * as Schema from 'effect/Schema'

/**
 * Error thrown when an OPFS operation fails.
 */
export class OPFSError extends Schema.TaggedError<OPFSError>()('OPFSError', {
  operation: Schema.String,
  path: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}
