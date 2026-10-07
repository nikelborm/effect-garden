import * as Schema from 'effect/Schema'

import { AccordSchema } from '../../../../domain/Accord.ts'
import { StrengthSchema } from '../../../../domain/Strength.ts'
import { SilenceBoundBaseQueue } from './Queue.ts'

export class SilenceBoundBaseState extends Schema.TaggedClass<SilenceBoundBaseState>()(
  'SilenceBoundBaseState',
  {
    accord: AccordSchema,
    strength: StrengthSchema,
    transitionQueue: SilenceBoundBaseQueue,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
