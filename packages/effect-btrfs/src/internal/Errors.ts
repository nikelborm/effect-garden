import { BadExitCodeError, ParseErrorSchema } from '@evadev/effect-helpers'

import { PlatformError } from '@effect/platform/Error'
import * as Schema from 'effect/Schema'

const fields = {
  args: Schema.Array(Schema.NonEmptyTrimmedString),
  cause: Schema.Union(BadExitCodeError, ParseErrorSchema, PlatformError),
}

export class BtrfsFindRootsError extends Schema.TaggedError<BtrfsFindRootsError>()(
  'BtrfsFindRootError',
  fields,
) {}

export class BtrfsListRootsError extends Schema.TaggedError<BtrfsListRootsError>()(
  'BtrfsListRootError',
  fields,
) {}
