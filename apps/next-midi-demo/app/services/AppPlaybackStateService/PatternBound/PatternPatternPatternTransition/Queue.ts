import * as Schema from 'effect/Schema'

import {
  FadingOutPatternPlayback,
  IncomingPatternFadingIn,
} from '../../loopElements.ts'

export const PatternPatternPatternTransitionQueue = Schema.Tuple([
  FadingOutPatternPlayback,
  FadingOutPatternPlayback,
  IncomingPatternFadingIn,
])
export const isPatternPatternPatternTransitionQueue = Schema.is(
  PatternPatternPatternTransitionQueue,
)
