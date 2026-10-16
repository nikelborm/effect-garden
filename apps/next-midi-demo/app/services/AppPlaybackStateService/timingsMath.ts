import {
  schedulingSafeBufferInSeconds,
  tickSizeInSeconds,
  trackSizeInSeconds,
  transitionTimeInSeconds,
} from './constants.ts'

export const calcBlissfulGridTimingsMath = (
  firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
  secondsDecimalNowPassedSinceAudioContextInit: number,
) => {
  const secondsDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted =
    secondsDecimalNowPassedSinceAudioContextInit -
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit

  const ticksDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted =
    secondsDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted /
    tickSizeInSeconds

  const secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted =
    secondsDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted %
    trackSizeInSeconds

  const nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted =
    Math.ceil(
      ticksDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,
    )

  const secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart =
    nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted *
    tickSizeInSeconds

  const nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit =
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit +
    secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart

  const patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder =
    nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit

  const patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder =
    nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit +
    transitionTimeInSeconds

  // TODO: separate in-pattern transitions between ticks and 8th-tick-of-pattern -> 1th-tick-of-pattern

  const secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder =
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder -
    secondsDecimalNowPassedSinceAudioContextInit

  const fitsIntoBufferOfClosestTransition =
    secondsDecimalNowPassedSinceAudioContextInit <=
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder -
      schedulingSafeBufferInSeconds

  const nextTickIndexAdjustedUpwardsSafeToScheduleSince_FIRST_PatternPlaybackOfTheCurrentGridStarted =
    nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted +
    (fitsIntoBufferOfClosestTransition ? 1 : 0)

  const nextTickAdjustedUpwardsSafeToScheduleStarts_AT_SECONDS_SinceAudioContextInit =
    nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit +
    (fitsIntoBufferOfClosestTransition ? tickSizeInSeconds : 0)

  const patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit =
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder +
    (fitsIntoBufferOfClosestTransition ? tickSizeInSeconds : 0)

  const patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit =
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder +
    (fitsIntoBufferOfClosestTransition ? tickSizeInSeconds : 0)

  const secondsSinceNowUpUntilAntialiasingFadeoutEnds =
    secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder +
    (fitsIntoBufferOfClosestTransition ? tickSizeInSeconds : 0)

  const secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsSafeToScheduleStart =
    secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart +
    (fitsIntoBufferOfClosestTransition ? tickSizeInSeconds : 0)

  return {
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
    ticksDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,

    fitsIntoBufferOfClosestTransition,
    secondsDecimalNowPassedSinceAudioContextInit,

    secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
    secondsDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,

    // recommended to use because they're adjusted
    nextTickIndexAdjustedUpwardsSafeToScheduleSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,
    nextTickAdjustedUpwardsSafeToScheduleStarts_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
    secondsSinceNowUpUntilAntialiasingFadeoutEnds,
    secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsSafeToScheduleStart,

    // NOT recommended to use because they're NOT adjusted
    nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,
    nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder,
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder,
    secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder,
    secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart,
  } as const
}

export interface BlissfulGridTimingsMath
  extends ReturnType<typeof calcBlissfulGridTimingsMath> {}
