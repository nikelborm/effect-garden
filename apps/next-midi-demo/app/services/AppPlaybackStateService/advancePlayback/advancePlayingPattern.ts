import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { PlayingLoopPlayback } from '../types/loopElements.ts'
import { PatternPatternTransition } from '../types/PatternPatternTransition.ts'
import { PatternSilenceTransition } from '../types/PatternSilenceTransition.ts'
import type { PlayingPattern } from '../types/PlayingPattern.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { Signal } from './signal.ts'

export const advancePlayingPattern = Effect.fn('advancePlayingPattern')(
  function* (oldState: PlayingPattern, signal: Signal) {
    // Re-selecting the accord/strength already playing — nothing changes.
    if (AccordData.models(signal) && signal.accord === oldState.asset.accord)
      return oldState
    if (
      StrengthData.models(signal) &&
      signal.strength === oldState.asset.strength
    )
      return oldState

    const live = PlayingLoopPlayback.make({
      asset: oldState.asset,
      playback: oldState.playback,
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    })

    // Pattern was deselected while its loop was playing — fade out to silence
    // with the long stopping fade.
    if (PatternData.models(signal) && signal.pattern === oldState.asset.pattern)
      return new PatternSilenceTransition({
        playbackStartedAtSecond: oldState.playbackStartedAtSecond,
        accord: oldState.asset.accord,
        strength: oldState.asset.strength,
        transitionQueue: [yield* live.beginLongFadeoutToSilence()],
      })

    // Otherwise switch the playing loop to a new pattern/variant: the live loop
    // rolls over on the next tick while the new loop fades in.
    const asset = desiredAssetFromSignal(signal, oldState.asset)
    return new PatternPatternTransition({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        yield* live.beginShortFadeoutBeforeAnotherLoop(),
        yield* live.scheduleNextLoop(asset),
      ],
    })
  },
)
