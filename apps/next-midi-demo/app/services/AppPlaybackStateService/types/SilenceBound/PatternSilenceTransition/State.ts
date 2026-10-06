import * as Schema from 'effect/Schema'

import { SilenceBoundStateBase } from '../SilenceBoundStateBase.ts'
import { PatternSilenceTransitionQueue } from './Queue.ts'

export class PatternSilenceTransitionState extends SilenceBoundStateBase.extend<PatternSilenceTransitionState>(
  'PatternSilenceTransitionState',
)({
  transitionQueue: PatternSilenceTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternSilenceTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}
