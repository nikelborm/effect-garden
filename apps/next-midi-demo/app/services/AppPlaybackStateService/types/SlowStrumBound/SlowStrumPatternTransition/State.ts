import * as Schema from 'effect/Schema'

import { SlowStrumBoundStateBase } from '../Base/State.ts'
import { SlowStrumPatternTransitionQueue } from './Queue.ts'

export class SlowStrumPatternTransitionState extends SlowStrumBoundStateBase.extend<SlowStrumPatternTransitionState>(
  'SlowStrumPatternTransitionState',
)({
  transitionQueue: SlowStrumPatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is SlowStrumPatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}
