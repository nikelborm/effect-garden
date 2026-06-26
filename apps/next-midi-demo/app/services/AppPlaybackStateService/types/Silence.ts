import * as Schema from 'effect/Schema'

import { AccordSchema } from '../../../domain/Accord.ts'
import { StrengthSchema } from '../../../domain/Strength.ts'

// Silence carries the base selection (accord + strength) because there is no
// playing asset to read it from. Every other state carries it via its asset(s).
export class Silence extends Schema.TaggedClass<Silence>()('Silence', {
  accord: AccordSchema,
  strength: StrengthSchema,
}) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
