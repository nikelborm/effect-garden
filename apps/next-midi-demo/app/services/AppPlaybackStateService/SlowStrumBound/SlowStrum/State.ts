import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { PressedParamButtonId } from '../../../.././domain/PressedParamButtonId.ts'
import type { AdvanceFnReturn } from '../../index.ts'
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

  // A slow strum is sounding (queue = [strum]). Slow strums are the deferred
  // "monster": an interrupting strum regrids the whole tick grid, which is unsolved.
  // For now any input during a slow strum dies. The prior reference implementation
  // (interrupt-and-restart / schedule-loop-after-strum) lives in git history and in
  // the midi_scheduling_findings memory.
  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [strum] = this.transitionQueue
    yield* Effect.logError({ strum, pressedParamButtonId })
    return yield* Effect.die(new Error('slow strums are deferred (SlowStrum)'))
  }
}
