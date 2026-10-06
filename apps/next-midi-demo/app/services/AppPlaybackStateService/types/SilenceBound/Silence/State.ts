import * as Schema from 'effect/Schema'

import { defaultAccord } from '../../../../../domain/Accord.ts'
import { defaultStrength } from '../../../../../domain/Strength.ts'
import { SilenceBoundStateBase } from '../SilenceBoundStateBase.ts'
import { SilenceQueue } from './Queue.ts'

export class SilenceState extends SilenceBoundStateBase.extend<SilenceState>(
  'SilenceState',
)({
  transitionQueue: SilenceQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is SilenceState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
  static default = this.make({
    accord: defaultAccord,
    strength: defaultStrength,
    transitionQueue: [],
  })
}
