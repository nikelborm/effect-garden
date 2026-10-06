import * as Schema from 'effect/Schema'

import { FadingOutPatternPlayback } from '../../loopElements.ts'

export const PatternSilenceTransitionQueue = Schema.Tuple([
  FadingOutPatternPlayback,
])
export const isPatternSilenceTransitionQueue = Schema.is(
  PatternSilenceTransitionQueue,
)
