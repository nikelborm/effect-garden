import * as Config from 'effect/Config'

export const GPG_RECIPIENT = Config.nonEmptyString('GPG_RECIPIENT').pipe(
  Config.withDescription(
    `Change to the desired recipient email or key ID or override it during invocation`,
  ),
  Config.withDefault('kolya007.klass@gmail.com'),
)
