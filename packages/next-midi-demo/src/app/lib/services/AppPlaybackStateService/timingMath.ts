import {
  schedulingSafeBufferInSeconds,
  tickSizeInSeconds,
  trackSizeInSeconds,
  transitionTimeInSeconds,
} from './constants.ts'

export const calcTimingsMath = (
  playbackStartedAtSecond: number,
  secondsSinceAudioContextInit: number,
) => {
  const secondsPassedSincePlaybackStart =
    secondsSinceAudioContextInit - playbackStartedAtSecond

  const ticksPassedSincePlaybackStart =
    secondsPassedSincePlaybackStart / tickSizeInSeconds

  const secondsSinceLatestTrackLoopStart =
    secondsPassedSincePlaybackStart % trackSizeInSeconds

  let nextAdjustedTickIndexSincePlaybackStart = Math.ceil(
    ticksPassedSincePlaybackStart,
  )

  let nextAdjustedTickStartsAtSecondsSincePlaybackStart =
    nextAdjustedTickIndexSincePlaybackStart * tickSizeInSeconds

  let nextAdjustedTickStartsAtSecondsSinceAudioContextInit =
    playbackStartedAtSecond + nextAdjustedTickStartsAtSecondsSincePlaybackStart

  let playbackFadeoutStartsAt =
    nextAdjustedTickStartsAtSecondsSinceAudioContextInit -
    transitionTimeInSeconds

  let playbackFadeoutEndsAt =
    nextAdjustedTickStartsAtSecondsSinceAudioContextInit

  let secondsSinceNowUpUntilFadeoutEnds =
    playbackFadeoutEndsAt - secondsSinceAudioContextInit

  const fitsIntoBufferOfClosestTransition =
    secondsSinceAudioContextInit <=
    playbackFadeoutStartsAt - schedulingSafeBufferInSeconds

  if (!fitsIntoBufferOfClosestTransition) {
    nextAdjustedTickIndexSincePlaybackStart += 1
    nextAdjustedTickStartsAtSecondsSincePlaybackStart += tickSizeInSeconds
    nextAdjustedTickStartsAtSecondsSinceAudioContextInit += tickSizeInSeconds
    playbackFadeoutStartsAt += tickSizeInSeconds
    playbackFadeoutEndsAt += tickSizeInSeconds
    secondsSinceNowUpUntilFadeoutEnds += tickSizeInSeconds
  }

  return {
    fitsIntoBufferOfClosestTransition,
    secondsSinceAudioContextInit,
    secondsPassedSincePlaybackStart,
    nextAdjustedTickIndexSincePlaybackStart,
    nextAdjustedTickStartsAtSecondsSincePlaybackStart,
    nextAdjustedTickStartsAtSecondsSinceAudioContextInit,
    playbackFadeoutStartsAt,
    playbackFadeoutEndsAt,
    secondsSinceLatestTrackLoopStart,
    secondsSinceNowUpUntilFadeoutEnds,
  } as const
}
