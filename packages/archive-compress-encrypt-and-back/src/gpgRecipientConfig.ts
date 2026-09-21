import * as Config from 'effect/Config'
import * as Schema from 'effect/Schema'

export const GPG_RECIPIENT = Config.schema(
  Schema.NonEmptyString.annotate({
    description: `Change to the desired recipient email or key ID or override it during invocation`,
  }),
  'GPG_RECIPIENT',
)
