import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  getLocalAssetFileName,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../audioAssetHelpers.ts'
import { getFileHandle, readFileBuffer } from '../../opfs.ts'
import { CurrentlySelectedAssetState } from '../CurrentlySelectedAssetState.ts'
import { RootDirectoryHandle } from '../RootDirectoryHandle.ts'
import { getNewCleanedUpState } from './cleanupState.ts'
import {
  asEarlyAsPossibleInSeconds,
  maxLoudness,
  minLoudness,
  transitionTimeInSeconds,
} from './constants.ts'
import {
  getAudioBufferOfAsset,
  makeGetAudioBufferOfAsset,
} from './getAudioBufferOfAsset.ts'
import {
  createLoopingPlayback,
  createOneshotPlayback,
  getAudioBufferDurationSeconds,
  helpGarbageCollectionOfPlayback,
} from './playbackNodes/index.ts'
import { reschedulePlayback } from './reschedulePlayback/reschedulePlayback.ts'
import type {
  AppPlaybackState,
  CleanupFiberToolkit,
  PlayingAppPlaybackStates,
  PlayingLoop,
  PlayingSlowStrum,
} from './types/index.ts'

export const makeNewPlayingAssetState = Effect.gen(function* () {
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
    _tag: 'PlayingLoop' as const,
    transitionQueue: [{ playback: currentPlayback, asset: currentAsset }],
    playbackStartedAtSecond: secondsSinceAudioContextInit,
  } satisfies PlayingLoop
})
