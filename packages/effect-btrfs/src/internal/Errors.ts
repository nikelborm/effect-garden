import { BadExitCodeError } from '@evadev/effect-helpers'

import { PlatformError } from 'effect/PlatformError'
import * as Schema from 'effect/Schema'

// TODO: extract to @evadev/effect-helpers
const PlatformErrorSchema = Schema.instanceOf(PlatformError)
const SchemaErrorSchema = Schema.instanceOf(Schema.SchemaError)

const fields = {
  args: Schema.Array(Schema.Trimmed.check(Schema.isNonEmpty())),
  cause: Schema.Union([
    BadExitCodeError,
    SchemaErrorSchema,
    PlatformErrorSchema,
  ]),
}

export class BtrfsFindRootsError extends Schema.TaggedError<BtrfsFindRootsError>()(
  'BtrfsFindRootError',
  fields,
) {}

export class BtrfsListRootsError extends Schema.TaggedError<BtrfsListRootsError>()(
  'BtrfsListRootError',
  fields,
) {}
