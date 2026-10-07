import * as Schema from 'effect/Schema'

import {
  IncomingPatternFadingIn,
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
} from '../../loopElements.ts'

export const PatternPatternTransitionQueue = Schema.Tuple([
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
  IncomingPatternFadingIn,
])
export const isPatternPatternTransitionQueue = Schema.is(
  PatternPatternTransitionQueue,
)
