import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'

import { AccordData } from '../../../brandsAndDatas/Accord.ts'
import type { AssetPointer } from '../../../brandsAndDatas/AssetPointer.ts'
import { StrengthData } from '../../../brandsAndDatas/Strength.ts'
import type { RootDirectoryHandle } from '../../RootDirectoryHandle.ts'
import { getAudioBufferOfAsset } from '../getAudioBufferOfAsset.ts'
import {
  createScheduledNextPlayback,
  scheduleFadeOutOf,
} from '../playbackNodes/index.ts'
import { calcTimingsMath } from '../timingMath.ts'
import type {
  PatternPatternTransition,
  PatternSilenceTransition,
  PlayingPattern,
  Silence,
} from '../types/index.ts'
import type { AdvancePlaybackDeps } from './deps.ts'
import type { Signal } from './signal.ts'

export const advanceSilence = Effect.fn('advanceSilence')(function* (
  oldState: Silence,
  signal: Signal,
  deps: AdvancePlaybackDeps,
) {
  if (StrengthData.models(signal)) {
    // Although should probably at least change the Ref with config
    return oldState
  }

  if (AccordData.models(signal)) {
    // should run slow strum with patched accord
    return yield* Effect.dieMessage('Playing slow strums is unimplemented')
  }
  signal.pattern

  const selectedAssetState = yield* CurrentlySelectedAssetState
  const audioContext = yield* EAudioContext.EAudioContext

  if (!(yield* selectedAssetState.isFinishedDownloadCompletely))
    return yield* Effect.die(
      'Play command should only be called when the current asset finished loading',
    )

  const currentAsset = yield* selectedAssetState.current

  const audioBuffer = yield* getAudioBufferOfAsset(currentAsset)

  const secondsSinceAudioContextInit =
    yield* EAudioContext.currentTime(audioContext)

  if (Option.isNone(currentAsset.pattern)) {
    const currentPlayback = yield* createOneshotPlayback(
      audioContext,
      audioBuffer,
    )

    yield* Effect.sync(() => {
      currentPlayback.gainNode.gain.setValueAtTime(
        maxLoudness,
        asEarlyAsPossibleInSeconds,
      )
      currentPlayback.bufferSource.start(secondsSinceAudioContextInit)
    })

    yield* Effect.log('started playing slow strum')

    const durationSeconds = getAudioBufferDurationSeconds(audioBuffer)

    return {
      _tag: 'PlayingSlowStrum' as const,
      transitionQueue: [
        {
          playback: currentPlayback,
          asset: currentAsset,
          durationSeconds,
        },
      ],
      playbackStartedAtSecond: secondsSinceAudioContextInit,
    } satisfies PlayingSlowStrum
  }

  const currentPlayback = yield* createLoopingPlayback(
    audioContext,
    audioBuffer,
  )

  yield* Effect.sync(() => {
    currentPlayback.gainNode.gain.setValueAtTime(
      maxLoudness,
      asEarlyAsPossibleInSeconds,
    )
    currentPlayback.bufferSource.start(secondsSinceAudioContextInit)
  })

  yield* Effect.log('started playing')

  return {
    _tag: 'PlayingPattern' as const,
    transitionQueue: [{ playback: currentPlayback, asset: currentAsset }],
    playbackStartedAtSecond: secondsSinceAudioContextInit,
  } satisfies PlayingPattern
})
