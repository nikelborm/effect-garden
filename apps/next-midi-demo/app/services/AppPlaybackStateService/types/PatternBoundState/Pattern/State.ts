import * as Schema from 'effect/Schema'

import { PatternBoundStateBase } from '../PatternBoundStateBase.ts'
import { PatternQueue } from './Queue.ts'

export class PatternState extends PatternBoundStateBase.extend<PatternState>(
  'PatternState',
)({
  transitionQueue: PatternQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is PatternState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}
