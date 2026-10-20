import * as Effect from 'effect/Effect'
import { flow } from 'effect/Function'
import * as Schema from 'effect/Schema'

import { DisposePlayback } from '../webAudioSideEffects/DisposePlayback.ts'

/** 🏁 */
// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class DisposedPatternPlayback extends Schema.TaggedClass<DisposedPatternPlayback>()(
  'DisposedPatternPlayback',
  {},
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
  static default = this.make({})
}

/** 🏁 */
export const disposeOf = Effect.fn('disposeOf')(
  flow(DisposePlayback.run, Effect.as(DisposedPatternPlayback.default)),
)
