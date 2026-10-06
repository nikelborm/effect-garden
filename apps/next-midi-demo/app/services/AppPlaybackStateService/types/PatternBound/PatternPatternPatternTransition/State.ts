import * as Schema from 'effect/Schema'

import { PatternBoundStateBase } from '../Base/State.ts'
import { PatternPatternPatternTransitionQueue } from './Queue.ts'

export class PatternPatternPatternTransitionState extends PatternBoundStateBase.extend<PatternPatternPatternTransitionState>(
  'PatternPatternPatternTransitionState',
)({
  transitionQueue: PatternPatternPatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternPatternPatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}
