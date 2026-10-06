import * as Schema from 'effect/Schema'

import { PatternBoundStateBase } from '../Base/State.ts'
import { PatternSilencePatternTransitionQueue } from './Queue.ts'

export class PatternSilencePatternTransitionState extends PatternBoundStateBase.extend<PatternSilencePatternTransitionState>(
  'PatternSilencePatternTransitionState',
)({
  transitionQueue: PatternSilencePatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternSilencePatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}
