import * as Schema from 'effect/Schema'

import { defaultAccord } from '../../../../domain/Accord.ts'
import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../../domain/AssetPointer.ts'
import { PatternData } from '../../../../domain/Pattern.ts'
import type { PressedParamButtonId } from '../../../../domain/PressedParamButtonId.ts'
import { defaultStrength, StrengthData } from '../../../../domain/Strength.ts'
import { AudioBufferStore } from '../../../AudioBufferStore.ts'
import type { AdvanceFnReturn } from '../../index.ts'
import {
  getAudioNow,
  PatternPlayback,
  SlowStrumPlayback,
} from '../../loopElements.ts'
import { PatternState } from '../../PatternBound/Pattern/State.ts'
import { SlowStrumState } from '../../SlowStrumBound/SlowStrum/State.ts'
import { StartFreshPlayback } from '../../webAudioSideEffects/StartFreshPlayback.ts'
import { SilenceBoundBaseState } from '../Base/State.ts'
import { SilenceQueue } from './Queue.ts'

export class SilenceState extends SilenceBoundBaseState.extend<SilenceState>(
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
  });

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const { accord, strength } = this

    if (StrengthData.models(pressedParamButtonId))
      return SilenceState.make({
        accord,
        strength: pressedParamButtonId.strength,
        transitionQueue: [],
      })

    const asset: AssetPointer = PatternData.models(pressedParamButtonId)
      ? TaggedPatternPointer.make({
          pattern: pressedParamButtonId.pattern,
          accord,
          strength,
        })
      : TaggedSlowStrumPointer.make({
          accord: pressedParamButtonId.accord,
          strength,
        })

    const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
    const playbackStartedAtSecond = yield* getAudioNow

    const playback = yield* StartFreshPlayback.run(audioBuffer, {
      isLooping: PatternData.models(pressedParamButtonId),
      startAtSecond: playbackStartedAtSecond,
    })

    if (TaggedPatternPointer.models(asset))
      return PatternState.make({
        playbackStartedAtSecond,
        transitionQueue: [
          PatternPlayback.make({ asset, playback, playbackStartedAtSecond }),
        ],
      })

    return SlowStrumState.make({
      playbackStartedAtSecond,
      transitionQueue: [
        SlowStrumPlayback.make({ asset, playback, playbackStartedAtSecond }),
      ],
    })
  }
}
