import type { Identity } from '@evadev/effect-helpers/Identity.ts'

import * as Schema from 'effect/Schema'

import {
  schedulingSafeBufferInSeconds,
  tickSizeInSeconds,
  ticksPerTrack,
  trackSizeInSeconds,
  transitionTimeInSeconds,
} from './constants.ts'

// Everything that is identical no matter whether the switch happens on the last
// quant of the outgoing pattern (a complete transition) or in the middle of it.
// The two follow-up calculations add the shifted fade windows on top.
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
  nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary: Schema.Boolean,
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

export interface BlissfulGridTimingsMath
  // @effect-diagnostics-next-line unnecessaryTypeofType:off
  extends Identity<typeof BlissfulGridTimingsMath.Type> {}

const CommonNewFields = {
  // recommended to use because they're adjusted
  patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit:
    Schema.Finite,
  secondsSinceNowUpUntilAntialiasingFadeoutEnds: Schema.Finite,
}

// The tick is the last quant of the outgoing pattern and the initial quant of the
// incoming one. The flag is narrowed to a literal so the routing choice is
// visible in the type of the value itself.
export const BlissfulGridTimingsMathAtLastQuant = Schema.Struct({
  ...BlissfulGridTimingsMath.fields,
  ...CommonNewFields,
  nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary:
    Schema.Literal(true),
})

export interface BlissfulGridTimingsMathAtLastQuant
  // @effect-diagnostics-next-line unnecessaryTypeofType:off
  extends Identity<typeof BlissfulGridTimingsMathAtLastQuant.Type> {}

// The tick is somewhere in the middle of the pattern, so both fade windows are
// centered on it instead of ending/starting on it.
export const BlissfulGridTimingsMathAtMiddleQuant = Schema.Struct({
  ...BlissfulGridTimingsMath.fields,
  ...CommonNewFields,
  nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary:
    Schema.Literal(false),
})
export interface BlissfulGridTimingsMathAtMiddleQuant
  // @effect-diagnostics-next-line unnecessaryTypeofType:off
  extends Identity<typeof BlissfulGridTimingsMathAtMiddleQuant.Type> {}

// For elements that keep a fade window but do not themselves decide which class
// of switch they belong to (the fade-to-silence loop is not split per quant).
export const BlissfulGridTimingsMathAtAnyQuant = Schema.Union([
  BlissfulGridTimingsMathAtLastQuant,
  BlissfulGridTimingsMathAtMiddleQuant,
])

export type BlissfulGridTimingsMathAtAnyQuant =
  | BlissfulGridTimingsMathAtLastQuant
  | BlissfulGridTimingsMathAtMiddleQuant

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
    nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary,
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

const common = <
  T extends boolean,
  TArg extends BlissfulGridTimingsMathAtAnyQuant & {
    nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary: T
  },
  TR,
>(
  blissfulGridTimingsMath: BlissfulGridTimingsMath,
  patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds: number,
  patternPlaybackAntialiasingFadeinShiftEarlierBySeconds: number,
  nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary: T,
  maker: { make: (arg: TArg) => TR },
) => {
  const postponeSeconds =
    Number(blissfulGridTimingsMath.doesntFitIntoBufferOfClosestTransition) *
    tickSizeInSeconds

  const patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit =
    blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder +
    postponeSeconds -
    patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds

  const patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit =
    blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInitIfWeArentAtTheTickBorder +
    postponeSeconds -
    patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds

  const patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit =
    blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleStarts_AT_SECONDS_SinceAudioContextInit -
    patternPlaybackAntialiasingFadeinShiftEarlierBySeconds

  const patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit =
    blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleStarts_AT_SECONDS_SinceAudioContextInit +
    transitionTimeInSeconds -
    patternPlaybackAntialiasingFadeinShiftEarlierBySeconds

  const secondsSinceNowUpUntilAntialiasingFadeoutEnds =
    blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEndsIfWeArentAtTheTickBorder +
    postponeSeconds -
    patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds

  return maker.make({
    ...blissfulGridTimingsMath,
    nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary,

    // recommended to use because they're adjusted
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit,
    secondsSinceNowUpUntilAntialiasingFadeoutEnds,
  } as TArg)
}

export const calcBlissfulGridTimingsMathAtLastQuant = (
  blissfulGridTimingsMath: BlissfulGridTimingsMath,
): BlissfulGridTimingsMathAtLastQuant => {
  // On a pattern boundary the outgoing fadeout ends exactly on the tick and the
  // incoming fadein starts there.
  const patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds =
    transitionTimeInSeconds
  const patternPlaybackAntialiasingFadeinShiftEarlierBySeconds = 0

  return common(
    blissfulGridTimingsMath,
    patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds,
    patternPlaybackAntialiasingFadeinShiftEarlierBySeconds,
    true,
    BlissfulGridTimingsMathAtLastQuant,
  )
}

export const calcBlissfulGridTimingsMathAtMiddleQuant = (
  blissfulGridTimingsMath: BlissfulGridTimingsMath,
): BlissfulGridTimingsMathAtMiddleQuant => {
  // Between ticks both windows are centered on the tick, so half of the
  // transition happens at the end of the outgoing pattern and half at the start
  // of the incoming one.
  const patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds =
    transitionTimeInSeconds / 2
  const patternPlaybackAntialiasingFadeinShiftEarlierBySeconds =
    transitionTimeInSeconds / 2

  return common(
    blissfulGridTimingsMath,
    patternPlaybackAntialiasingFadeoutShiftEarlierBySeconds,
    patternPlaybackAntialiasingFadeinShiftEarlierBySeconds,
    false,
    BlissfulGridTimingsMathAtMiddleQuant,
  )
}
