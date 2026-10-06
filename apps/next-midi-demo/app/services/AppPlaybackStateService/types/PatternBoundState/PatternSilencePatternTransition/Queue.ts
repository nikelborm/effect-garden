import * as Schema from 'effect/Schema'

import {
  IncomingPatternFadingIn,
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
} from '../../loopElements.ts'

export const PatternSilencePatternTransitionQueue = Schema.Tuple([
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  IncomingPatternFadingIn,
])
export const isPatternSilencePatternTransitionQueue = Schema.is(
  PatternSilencePatternTransitionQueue,
)
