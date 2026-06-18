import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'

import { AudioBufferStore } from '../AudioBufferStore.ts'
import { CurrentlySelectedAssetState } from '../CurrentlySelectedAssetState.ts'
import { asEarlyAsPossibleInSeconds, maxLoudness } from './constants.ts'
import {
  createLoopingPlayback,
  createOneshotPlayback,
} from './playbackNodes/index.ts'
import { PlayingPattern } from './types/PlayingPattern.ts'
import { PlayingSlowStrum } from './types/PlayingSlowStrum.ts'

export const makeNewPlayingAssetState = Effect.gen(function* () {
  const selectedAssetState = yield* CurrentlySelectedAssetState
  const audioBufferStore = yield* AudioBufferStore
  const audioContext = yield* EAudioContext.EAudioContext

  // if (!(yield* selectedAssetState.isFinishedDownloadCompletely))
  //   return yield* Effect.die(
  //     'Play command should only be called when the current asset finished loading',
  //   )

  // const currentAsset = yield* selectedAssetState.current

  // const audioBuffer = yield* audioBufferStore.getByAsset(currentAsset)

  // const secondsSinceAudioContextInit =
  //   yield* EAudioContext.currentTime(audioContext)

  // if (Option.isNone(currentAsset.pattern)) {
  //   const currentPlayback = yield* createOneshotPlayback(
  //     audioContext,
  //     audioBuffer,
  //   )

  //   yield* Effect.sync(() => {
  //     currentPlayback.gainNode.gain.setValueAtTime(
  //       maxLoudness,
  //       asEarlyAsPossibleInSeconds,
  //     )
  //     currentPlayback.bufferSource.start(secondsSinceAudioContextInit)
  //   })

  //   yield* Effect.log('started playing slow strum')

  //   return PlayingSlowStrum.make({
  //     playback: currentPlayback,
  //     asset: currentAsset,
  //     playbackStartedAtSecond: secondsSinceAudioContextInit,
  //   })
  // }

  // const currentPlayback = yield* createLoopingPlayback(
  //   audioContext,
  //   audioBuffer,
  // )

  // yield* Effect.sync(() => {
  //   currentPlayback.gainNode.gain.setValueAtTime(
  //     maxLoudness,
  //     asEarlyAsPossibleInSeconds,
  //   )
  //   currentPlayback.bufferSource.start(secondsSinceAudioContextInit)
  // })

  // yield* Effect.log('started playing')

  // return PlayingPattern.make({
  //   playback: currentPlayback,
  //   asset: currentAsset,
  //   playbackStartedAtSecond: secondsSinceAudioContextInit,
  // })
})
