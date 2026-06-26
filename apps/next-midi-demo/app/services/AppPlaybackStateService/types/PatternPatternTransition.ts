import * as Schema from 'effect/Schema'

import { FadingOutLoopPlayback, IncomingLoopFadingIn } from './loopElements.ts'

export class PatternPatternTransition extends Schema.TaggedClass<PatternPatternTransition>()(
  'PatternPatternTransition',
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
