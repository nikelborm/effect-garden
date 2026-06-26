import * as Schema from 'effect/Schema'

import { AccordSchema } from '../../../domain/Accord.ts'
import { StrengthSchema } from '../../../domain/Strength.ts'
import { FadingOutLoopPlayback } from './loopElements.ts'

export class PatternSilenceTransition extends Schema.TaggedClass<PatternSilenceTransition>()(
  'PatternSilenceTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    // base selection carried towards the upcoming silence
    accord: AccordSchema,
    strength: StrengthSchema,
    transitionQueue: Schema.Tuple(FadingOutLoopPlayback),
  },
) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
