import * as Schema from 'effect/Schema'

import { FadingOutLoopPlayback, IncomingLoopFadingIn } from './loopElements.ts'

// A loop that was already fading out to SILENCE (its long stopping fade) gets a
// different pattern pressed on top. We can't take the stop back (red zone), so
// the old loop finishes dying while a new loop rolls in on the next tick. The
// "silence" in the name is the old loop's trajectory, NOT an audible gap and
// NOT a queue element — structurally this is just [dying loop, incoming loop].
export class PatternSilencePatternTransition extends Schema.TaggedClass<PatternSilencePatternTransition>()(
  'PatternSilencePatternTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(FadingOutLoopPlayback, IncomingLoopFadingIn),
  },
) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
