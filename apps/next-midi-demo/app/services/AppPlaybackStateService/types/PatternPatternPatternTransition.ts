import * as Schema from 'effect/Schema'

import { FadingOutLoopPlayback, IncomingLoopFadingIn } from './loopElements.ts'

export class PatternPatternPatternTransition extends Schema.TaggedClass<PatternPatternPatternTransition>()(
  'PatternPatternPatternTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      FadingOutLoopPlayback,
      FadingOutLoopPlayback,
      IncomingLoopFadingIn,
    ),
  },
) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
