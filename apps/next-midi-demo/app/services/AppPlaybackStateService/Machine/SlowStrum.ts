import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { TaggedSlowStrumPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import { SlowStrumPlayback } from '../Elements/SlowStrumPlayback.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'

export const SlowStrumQueue = Schema.Tuple([SlowStrumPlayback])

export class SlowStrumState extends Schema.TaggedClass<SlowStrumState>()(
  'SlowStrumState',
  {
    // TODO: wrong concept applied!?!?
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
      Schema.Finite,
    transitionQueue: SlowStrumQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

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

  static init = Effect.fn('SlowStrumState.init')(
    { self: this },
    function* (asset: TaggedSlowStrumPointer) {
      const now = yield* GetAudioNow.run
      const math = calcBlissfulGridTimingsMath(now, now)

      return this.makeSimple(now, yield* SlowStrumPlayback.init(asset, math))
    },
  )

  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    playback: SlowStrumPlayback,
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue: [playback],
    })
}
