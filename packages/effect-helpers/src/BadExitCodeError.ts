import * as Schema from 'effect/Schema'

export class BadExitCodeError extends Schema.TaggedError<BadExitCodeError>()(
  'BadExitCodeError',
  {
    stdout: Schema.String,
    stderr: Schema.String,
    exitCode: Schema.NonNegativeInt,
  },
) {}
