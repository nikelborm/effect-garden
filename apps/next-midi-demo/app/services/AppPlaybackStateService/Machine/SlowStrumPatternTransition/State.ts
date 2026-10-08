import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { PressedParamButtonId } from '../../../../domain/PressedParamButtonId.ts'
import type { AdvanceFnReturn } from '../../index.ts'
import { SlowStrumPatternTransitionQueue } from './Queue.ts'

export class SlowStrumPatternTransitionState extends Schema.TaggedClass<SlowStrumPatternTransitionState>()(
  'SlowStrumPatternTransitionState',
  {
    playbackStartedAtSecond: Schema.Finite,
    transitionQueue: SlowStrumPatternTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is SlowStrumPatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  // A slow strum handing over to a loop (queue = [strum, scheduledPattern]). Like
  // SlowStrumState.advance this is part of the deferred slow-strum problem; any
  // input dies for now. Reference implementation: git history + the
  // midi_scheduling_findings memory.
  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [strum, scheduled] = this.transitionQueue
    yield* Effect.logError({ strum, scheduled, pressedParamButtonId })
    return yield* Effect.die(
      new Error('slow strums are deferred (SlowStrumPattern)'),
    )
  }
}
