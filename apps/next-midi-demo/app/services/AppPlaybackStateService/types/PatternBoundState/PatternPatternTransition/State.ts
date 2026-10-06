import * as Schema from 'effect/Schema'

import { PatternBoundStateBase } from '../PatternBoundStateBase.ts'
import { PatternPatternTransitionQueue } from './Queue.ts'

export class PatternPatternTransitionState extends PatternBoundStateBase.extend<PatternPatternTransitionState>(
  'PatternPatternTransitionState',
)({
  transitionQueue: PatternPatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternPatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}
