import * as Struct from 'effect/Struct'

import {
  schedulingSafeBufferInSeconds,
  tickSizeInSeconds,
  trackSizeInSeconds,
  transitionTimeInSeconds,
} from './constants.ts'

export const calcBlissfulGridTimingsMath = (
  firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
  secondsDecimalNowPassedSinceAudioContextInit: number,
): TimingsMath => {
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

  //

  const patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder =
    nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit -
    transitionTimeInSeconds

  const patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder =
    nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit

  const secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder =
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder -
    secondsDecimalNowPassedSinceAudioContextInit

  const fitsIntoBufferOfClosestTransition =
    secondsDecimalNowPassedSinceAudioContextInit <=
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder -
      schedulingSafeBufferInSeconds

  return {
    fitsIntoBufferOfClosestTransition,
    secondsDecimalNowPassedSinceAudioContextInit,

    secondsDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,

    nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted,
    secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart,
    nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder,
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder,

    secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
    secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder,
  } as const
}

export interface TimingsMath {
  fitsIntoBufferOfClosestTransition: boolean
  secondsDecimalNowPassedSinceAudioContextInit: number

  secondsDecimalPassedSince_FIRST_PatternPlaybackOfTheCurrentGridStarted: number

  /**
   * might happen to be the index of the current tick if we are right at the
   * border between ticks (integer). otherwise predictably the index of the next
   * tick
   */
  nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted: number
  secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart: number
  nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit: number
  patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder: number
  patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder: number

  secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted: number
  secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder: number
}

// TODO: add export of Evolver type from effect/Struct internals
type TimingsMathEvolver = {
  readonly [K in keyof TimingsMath]?: (a: TimingsMath[K]) => TimingsMath[K]
}

const timingsMathEvolver: TimingsMathEvolver = {
  nextTickIndexAdjustedUpwardsIfDecimalSince_FIRST_PatternPlaybackOfTheCurrentGridStarted:
    v => v + 1,
  secondsDiffBetweenFirstPatternPlaybackOfTheCurrentGridStartAndNextTickAdjustedUpwardsWhenDecimalStart:
    v => v + tickSizeInSeconds,
  nextTickAdjustedUpwardsWhenDecimalStarts_AT_SECONDS_SinceAudioContextInit:
    v => v + tickSizeInSeconds,
  patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder:
    v => v + tickSizeInSeconds,
  patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder:
    v => v + tickSizeInSeconds,
  secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder: v =>
    v + tickSizeInSeconds,
}

export const postponeTimingsToTheNextSlot: (
  timingsMath: TimingsMath,
) => TimingsMath = Struct.evolve<TimingsMath, TimingsMathEvolver>(
  timingsMathEvolver,
)

export const adjustTimingsIfTransitionDoesntFitIntoTheCurrentSlot = (
  timingsMath: TimingsMath,
) =>
  timingsMath.fitsIntoBufferOfClosestTransition
    ? timingsMath
    : postponeTimingsToTheNextSlot(timingsMath)
