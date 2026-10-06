import * as Schema from 'effect/Schema'

import { SlowStrumBoundStateBase } from '../Base/State.ts'
import { SlowStrumQueue } from './Queue.ts'

export class SlowStrumState extends SlowStrumBoundStateBase.extend<SlowStrumState>(
  'SlowStrumState',
)({
  transitionQueue: SlowStrumQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is SlowStrumState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}
