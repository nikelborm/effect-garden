import * as Schema from 'effect/Schema'

import { SilenceBoundStateBase } from '../SilenceBoundStateBase.ts'
import { TwoPatternsFadingToSilenceQueue } from './Queue.ts'

export class PatternPatternSilenceTransitionState extends SilenceBoundStateBase.extend<PatternPatternSilenceTransitionState>(
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
