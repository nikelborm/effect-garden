import * as Schema from 'effect/Schema'

import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from './PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
import { PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern } from './PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.ts'

export const FadingOutPatternPlayback = Schema.Union([
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
])
export type FadingOutPatternPlayback = typeof FadingOutPatternPlayback.Type
