import * as Schema from 'effect/Schema'

import { FadingOutPatternPlayback } from '../../loopElements.ts'

export const TwoPatternsFadingToSilenceQueue = Schema.Tuple([
  FadingOutPatternPlayback,
  FadingOutPatternPlayback,
])
export const isTwoPatternsFadingToSilenceQueue = Schema.is(
  TwoPatternsFadingToSilenceQueue,
)
