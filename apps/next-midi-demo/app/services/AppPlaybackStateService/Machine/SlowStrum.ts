import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { TaggedSlowStrumPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { getAudioNow, SlowStrumPlayback } from '../loopElements.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/StartFreshPlayback.ts'

export const SlowStrumQueue = Schema.Tuple([SlowStrumPlayback])
export const isSlowStrumQueue = Schema.is(SlowStrumQueue)

export class SlowStrumState extends Schema.TaggedClass<SlowStrumState>()(
  'SlowStrumState',
  {
    firstPlaybackOfTheCurrentGridStartedAtSecondSinceAudioContextInit:
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
      const audioBuffer = yield* AudioBufferStore.getByAsset(asset)

      const firstPlaybackOfTheCurrentGridStartedAtSecondSinceAudioContextInit =
        yield* getAudioNow

      const playback = yield* StartFreshPlayback.runLooping(
        audioBuffer,
        firstPlaybackOfTheCurrentGridStartedAtSecondSinceAudioContextInit,
      )

      return this.make({
        firstPlaybackOfTheCurrentGridStartedAtSecondSinceAudioContextInit,
        transitionQueue: [
          SlowStrumPlayback.make({
            asset,
            playback,
            playbackStartedAtSecond:
              firstPlaybackOfTheCurrentGridStartedAtSecondSinceAudioContextInit,
          }),
        ],
      })
    },
  )
}
