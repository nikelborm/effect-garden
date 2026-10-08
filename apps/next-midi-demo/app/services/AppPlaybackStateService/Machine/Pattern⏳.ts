import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameAccordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { getAudioNow, PatternPlayback } from '../loopElements.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/StartFreshPlayback.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternTransitionState } from './PatternPatternTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'

export const PatternQueue = Schema.Tuple([PatternPlayback])
export const isPatternQueue = Schema.is(PatternQueue)

export class PatternState extends Schema.TaggedClass<PatternState>()(
  'PatternState',
  { firstPlaybackInitAtSecond: Schema.Finite, transitionQueue: PatternQueue },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [current] = this.transitionQueue

    if (theSameAccordOrStrengthWasPressed(pressedParamButtonId, current.asset))
      return this

    if (theSamePatternWasPressed(pressedParamButtonId, current.asset))
      return PatternSilenceTransitionState.makeSimple(
        current.asset.accord,
        current.asset.strength,
        yield* current.beginLongFadeoutToSilence(),
      )

    const asset = current.asset.makePatchedFrom(pressedParamButtonId)

    return PatternPatternTransitionState.make({
      playbackStartedAtSecond: current.playbackStartedAtSecond,
      transitionQueue: [
        yield* current.beginShortFadeoutBeforeAnotherPattern(),
        yield* current.scheduleNextPattern(asset),
      ],
    })
  }

  static init = Effect.fn('PatternState.init')(
    { self: this },
    function* (asset: TaggedPatternPointer) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(asset)

      const firstPlaybackInitAtSecond = yield* getAudioNow

      const playback = yield* StartFreshPlayback.runLooping(
        audioBuffer,
        firstPlaybackInitAtSecond,
      )

      return this.make({
        firstPlaybackInitAtSecond,
        transitionQueue: [
          PatternPlayback.make({
            asset,
            playback,
            playbackStartedAtSecond: firstPlaybackInitAtSecond,
          }),
        ],
      })
    },
  )

  // handleSecondTapForDeactivation
}
