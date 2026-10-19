import * as Schema from 'effect/Schema'

import {
  schedulingSafeBufferInSeconds,
  tickSizeInSeconds,
  ticksPerTrack,
  trackSizeInSeconds,
  transitionTimeInSeconds,
} from './constants.ts'

export const BlissfulGridTimingsMath = Schema.Struct({
  firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
    Schema.Finite,
  ticksDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted:
    Schema.Finite,

  doesntFitIntoBufferOfClosestTransition: Schema.Boolean,
  secondsDecimalNowPassedSinceAudioContextInit: Schema.Finite,

  secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted:
    Schema.Finite,
  secondsDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted:
    Schema.Finite,

  // recommended to use because they're adjusted
  nextTickIndexAdjustedUpwardsSafeToScheduleSince_FIRST_PatternPlaybackOfTheCurrentGridStarted:
    Schema.Finite,
  nextTickAdjustedUpwardsSafeToScheduleStarts_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  secondsSinceNowUpUntilAntialiasingFadeoutEnds: Schema.Finite,
  secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsSafeToScheduleStart:
    Schema.Finite,

  // NOT recommended to use because they're NOT adjusted
  nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted:
    Schema.Finite,
  nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder:
    Schema.Finite,
  patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder:
    Schema.Finite,
  secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder:
    Schema.Finite,
  secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart:
    Schema.Finite,
})

export type BlissfulGridTimingsMath = typeof BlissfulGridTimingsMath.Type

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

  const secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder =
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder -
    secondsDecimalNowPassedSinceAudioContextInit

  const nextTickAdjustedUpwardsIsOnThePatternBoundary =
    nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted %
      ticksPerTrack ===
    0

  // The fadeout does not start on the tick itself: it is shifted earlier either
  // by a whole transition (pattern boundary) or by half of it (mid-pattern). The
  // buffer check has to look at that real start, not at the tick.
  const patternPlaybackAntialiasingFadeoutOfTheClosestTickShiftedEarlierBySeconds =
    nextTickAdjustedUpwardsIsOnThePatternBoundary
      ? transitionTimeInSeconds
      : transitionTimeInSeconds / 2

  const doesntFitIntoBufferOfClosestTransition =
    secondsDecimalNowPassedSinceAudioContextInit >
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder -
      patternPlaybackAntialiasingFadeoutOfTheClosestTickShiftedEarlierBySeconds -
      schedulingSafeBufferInSeconds

  const postponeTicks = Number(doesntFitIntoBufferOfClosestTransition)
  const postponeSeconds = postponeTicks * tickSizeInSeconds

  const nextTickIndexAdjustedUpwardsSafeToScheduleSince_FIRST_PatternPlaybackOfTheCurrentGridStarted =
    nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted +
    postponeTicks

  const nextTickAdjustedUpwardsSafeToScheduleStarts_AT_SECONDS_SinceAudioContextInit =
    nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit +
    postponeSeconds

  const nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary =
    nextTickIndexAdjustedUpwardsSafeToScheduleSince_FIRST_PatternPlaybackOfTheCurrentGridStarted %
      ticksPerTrack ===
    0

  // On a pattern boundary the outgoing fadeout ends exactly on the tick and the
  // incoming fadein starts there. Between ticks both windows are centered on the
  // tick, so half of the transition happens at the end of the outgoing pattern
  // and half at the start of the incoming one.
  const patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds =
    nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
      ? transitionTimeInSeconds
      : transitionTimeInSeconds / 2

  const patternPlaybackAntialiasingFadeinShiftEarlierBySeconds =
    nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
      ? 0
      : transitionTimeInSeconds / 2

  const patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit =
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder +
    postponeSeconds -
    patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds

  const patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit =
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder +
    postponeSeconds -
    patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds

  const patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit =
    nextTickAdjustedUpwardsSafeToScheduleStarts_AT_SECONDS_SinceAudioContextInit -
    patternPlaybackAntialiasingFadeinShiftEarlierBySeconds

  const patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit =
    nextTickAdjustedUpwardsSafeToScheduleStarts_AT_SECONDS_SinceAudioContextInit +
    transitionTimeInSeconds -
    patternPlaybackAntialiasingFadeinShiftEarlierBySeconds

  const secondsSinceNowUpUntilAntialiasingFadeoutEnds =
    secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder +
    postponeSeconds -
    patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds

  const secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsSafeToScheduleStart =
    secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart +
    postponeSeconds

  return BlissfulGridTimingsMath.make({
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
    ticksDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,

    doesntFitIntoBufferOfClosestTransition,
    secondsDecimalNowPassedSinceAudioContextInit,

    secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
    secondsDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,

    // recommended to use because they're adjusted
    nextTickIndexAdjustedUpwardsSafeToScheduleSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,
    nextTickAdjustedUpwardsSafeToScheduleStarts_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit,
    secondsSinceNowUpUntilAntialiasingFadeoutEnds,
    secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsSafeToScheduleStart,

    // NOT recommended to use because they're NOT adjusted
    nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,
    nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder,
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder,
    secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder,
    secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart,
  })
}
