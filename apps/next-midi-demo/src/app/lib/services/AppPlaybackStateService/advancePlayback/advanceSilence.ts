import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../brandsAndDatas/AssetPointer.ts'
import { PatternData } from '../../../brandsAndDatas/Pattern.ts'
import { StrengthData } from '../../../brandsAndDatas/Strength.ts'
import { AccordRegistry } from '../../AccordRegistry.ts'
import { LoadedAssetSizeEstimationMap } from '../../LoadedAssetSizeEstimationMap.ts'
import { PatternRegistry } from '../../PatternRegistry.ts'
import { StrengthRegistry } from '../../StrengthRegistry.ts'
import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import { getAudioBufferOfAsset } from '../getAudioBufferOfAsset.ts'
import { createLoopingPlaybackInContext } from '../playbackNodes/createLoopingPlayback.ts'
import { createOneshotPlaybackInContext } from '../playbackNodes/createOneshotPlayback.ts'
import { PlayingPattern } from '../types/PlayingPattern.ts'
import { PlayingSlowStrum } from '../types/PlayingSlowStrum.ts'
import type { Silence } from '../types/Silence.ts'
import type { AdvancePlaybackDeps } from './deps.ts'
import type { Signal } from './signal.ts'

export const advanceSilence = Effect.fn('advanceSilence')(function* (
  oldState: Silence,
  signal: Signal,
  _deps: AdvancePlaybackDeps,
) {
  if (StrengthData.models(signal)) {
    // even if it's not downloaded, it's fine to set different strength, while
    // it's silent, because no playback will be scheduled
    yield* StrengthRegistry.selectStrength(signal.strength)
    return oldState
  }

  const strength = yield* StrengthRegistry.currentlySelectedStrength

  let asset: AssetPointer
  if (PatternData.models(signal)) {
    yield* PatternRegistry.replaceNoneOrDieIfPresent(signal.pattern)

    asset = TaggedPatternPointer.make({
      ...signal,
      accord: yield* AccordRegistry.currentlySelectedAccord,
      strength,
    })
  } else {
    yield* AccordRegistry.selectAccord(signal.accord)

    asset = TaggedSlowStrumPointer.make({ ...signal, strength })
  }

  yield* LoadedAssetSizeEstimationMap.assertFinished(asset)

  const audioBuffer = yield* getAudioBufferOfAsset(asset)

  const playbackStartedAtSecond = yield* EAudioContext.currentTimeFromContext

  const playback = yield* (
    PatternData.models(signal)
      ? createLoopingPlaybackInContext
      : createOneshotPlaybackInContext
  )(audioBuffer)

  yield* Effect.sync(() => {
    playback.gainNode.gain.setValueAtTime(
      maxLoudness,
      asEarlyAsPossibleInSeconds,
    )
    playback.bufferSource.start(playbackStartedAtSecond)
  })

  return TaggedPatternPointer.models(asset)
    ? new PlayingPattern({
        playback,
        asset,
        playbackStartedAtSecond,
      })
    : new PlayingSlowStrum({
        playback,
        asset,
        playbackStartedAtSecond,
      })
})
