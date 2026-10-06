import * as Schema from 'effect/Schema'

import { SilenceBoundBaseState } from '../Base/State.ts'
import { TwoPatternsFadingToSilenceQueue } from './Queue.ts'

export class PatternPatternSilenceTransitionState extends SilenceBoundBaseState.extend<PatternPatternSilenceTransitionState>(
  'PatternPatternSilenceTransitionState',
)({
  transitionQueue: TwoPatternsFadingToSilenceQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternPatternSilenceTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}
