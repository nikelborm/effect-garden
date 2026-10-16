import * as Effect from 'effect/Effect'
import { flow } from 'effect/Function'
import * as Schema from 'effect/Schema'

import {
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../AudioBufferStore.ts'
import { CleanupFiberMaker } from './CleanupFiberMaker.ts'
import { CleanupFiberToolkit } from './CleanupFiberToolkit.ts'
import { AudioPlayback } from './common.ts'
import {
  fadeToSilenceTimeInSeconds,
  transitionTimeInSeconds,
} from './constants.ts'
import type { BlissfulGridTimingsMath } from './timingsMath.ts'
import { DisposePlayback } from './webAudioSideEffects/DisposePlayback.ts'
import { GetAudioNow } from './webAudioSideEffects/GetAudioNow.ts'
import { RestoreFullVolume } from './webAudioSideEffects/RestoreFullVolume.ts'
import { ScheduleFadeIntoLoopPlayback } from './webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import { ScheduleFadeOut } from './webAudioSideEffects/ScheduleFadeOut.ts'

export const getAudioNow = GetAudioNow.run()

export class PatternPlayback extends Schema.TaggedClass<PatternPlayback>()(
  'PatternPlayback',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    playbackStartedAtSecond: Schema.Finite,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    playbackStartedAtSecond: number,
  ) => this.make({ asset, playback, playbackStartedAtSecond })

  beginShortFadeoutBeforeAnotherPattern = Effect.fn(
    'PatternPlayback.beginShortFadeoutBeforeAnotherPattern',
  )(
    { self: this },
    function* (blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.make({
        asset: this.asset,
        playback: this.playback,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
        cleanupFiberToolkit,
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
    },
  )

  beginLongFadeoutToSilence = Effect.fn(
    'PatternPlayback.beginLongFadeoutToSilence',
  )(
    { self: this },
    function* (blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      const { playbackStartedAtSecond } = this
      //!!!! PROBLEMATIC INCORRECT TIMINGS
      const fadeoutStartsAtSecond =
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit

      const fadeoutEndsAtSecond =
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit

      const fadeoutTimings = { fadeoutStartsAtSecond, fadeoutEndsAtSecond }
      yield* ScheduleFadeOut.run(this.playback, fadeoutTimings)

      return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.makeSimple(
        this.asset,
        this.playback,
        yield* CleanupFiberMaker.make(
          blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
        ),
        { playbackStartedAtSecond, fadeoutStartsAtSecond },
      )
    },
  )

  scheduleNextPattern = Effect.fn('PatternPlayback.scheduleNextPattern')(
    { self: this },
    function* (
      desiredAsset: TaggedPatternPointer,
      now: number,
      blissfulGridTimingsMath: BlissfulGridTimingsMath,
    ) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(desiredAsset)
      const playback = yield* ScheduleFadeIntoLoopPlayback.run(audioBuffer, {
        startAtSecond: now,
        bufferPhaseOffsetSeconds:
          blissfulGridTimingsMath.secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
        fadeInStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeInEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      return IncomingPatternFadingIn.make({
        asset: desiredAsset,
        playback,
        fadeInStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeInEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
      })
    },
  )
}

export class SlowStrumPlayback extends Schema.TaggedClass<SlowStrumPlayback>()(
  'SlowStrumPlayback',
  {
    playbackStartedAtSecond: Schema.Finite,
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  getDuration() {
    return this.playback.getDuration()
  }
}

export class DisposedPatternPlayback extends Schema.TaggedClass<DisposedPatternPlayback>()(
  'DisposedPatternPlayback',
  {},
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
  static default = this.make({})
}

const disposeOf = Effect.fn('disposeOf')(
  flow(DisposePlayback.run, Effect.as(DisposedPatternPlayback.default)),
)

export class IncomingPatternFadingIn extends Schema.TaggedClass<IncomingPatternFadingIn>()(
  'IncomingPatternFadingIn',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    fadeInStartsAtSecond: Schema.Finite,
    fadeInEndsAtSecond: Schema.Finite,
    playbackStartedAtSecond: Schema.Finite,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  drop() {
    return disposeOf(this.playback)
  }

  promoteToFadingOut = Effect.fn('IncomingPatternFadingIn.promoteToFadingOut')(
    { self: this },
    function* (blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.make({
        asset: this.asset,
        playback: this.playback,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
        cleanupFiberToolkit,
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
    },
  )

  promoteToFadeToSilence = Effect.fn(
    'IncomingPatternFadingIn.promoteToFadeToSilence',
  )(
    { self: this },
    function* (blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.make({
        asset: this.asset,
        playback: this.playback,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
        cleanupFiberToolkit,
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
    },
  )

  becomeLive() {
    return PatternPlayback.makeSimple(
      this.asset,
      this.playback,
      this.playbackStartedAtSecond,
    )
  }
}

export class PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern extends Schema.TaggedClass<PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern>()(
  'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    fadeoutStartsAtSecond: Schema.Finite,
    playbackStartedAtSecond: Schema.Finite,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    rest: { fadeoutStartsAtSecond: number; playbackStartedAtSecond: number },
  ) => this.make({ asset, playback, cleanupFiberToolkit, ...rest })

  get fadeoutEndsAtSecond() {
    return this.fadeoutStartsAtSecond + transitionTimeInSeconds
  }

  cancelFadeoutAndRestore = Effect.fn(
    'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.cancelFadeoutAndRestore',
  )({ self: this }, function* (now: number) {
    yield* RestoreFullVolume.run(this.playback, now)
    yield* this.cleanupFiberToolkit.cancelCleanup
    return PatternPlayback.makeSimple(
      this.asset,
      this.playback,
      this.playbackStartedAtSecond,
    )
  })

  reanchorFadeoutOnto = Effect.fn(
    'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.reanchorFadeoutOnto',
  )(
    { self: this },
    function* (now: number, blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      yield* this.cleanupFiberToolkit.cancelCleanup
      yield* RestoreFullVolume.run(this.playback, now)
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.make({
        asset: this.asset,
        playback: this.playback,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
        cleanupFiberToolkit,
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
    },
  )

  scheduleNextPattern = Effect.fn(
    'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.scheduleNextPattern',
  )(
    { self: this },
    function* (
      desiredAsset: TaggedPatternPointer,
      now: number,
      blissfulGridTimingsMath: BlissfulGridTimingsMath,
    ) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(desiredAsset)
      const playback = yield* ScheduleFadeIntoLoopPlayback.run(audioBuffer, {
        startAtSecond: now,
        bufferPhaseOffsetSeconds:
          blissfulGridTimingsMath.secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
        fadeInStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeInEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      return IncomingPatternFadingIn.make({
        asset: desiredAsset,
        playback,
        fadeInStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeInEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
      })
    },
  )

  dispose() {
    return disposeOf(this.playback)
  }
}

export class PatternPlaybackAtItsLastPlayWithScheduledLongFadeout extends Schema.TaggedClass<PatternPlaybackAtItsLastPlayWithScheduledLongFadeout>()(
  'PatternPlaybackAtItsLastPlayWithScheduledLongFadeout',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    fadeoutStartsAtSecond: Schema.Finite,
    playbackStartedAtSecond: Schema.Finite,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    rest: { fadeoutStartsAtSecond: number; playbackStartedAtSecond: number },
  ) => this.make({ asset, playback, cleanupFiberToolkit, ...rest })

  get fadeoutEndsAtSecond() {
    return this.fadeoutStartsAtSecond + fadeToSilenceTimeInSeconds
  }

  cancelFadeoutAndRestore = Effect.fn(
    'PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.cancelFadeoutAndRestore',
  )({ self: this }, function* (now: number) {
    yield* RestoreFullVolume.run(this.playback, now)
    yield* this.cleanupFiberToolkit.cancelCleanup
    return PatternPlayback.makeSimple(
      this.asset,
      this.playback,
      this.playbackStartedAtSecond,
    )
  })

  reanchorFadeoutOnto = Effect.fn(
    'PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.reanchorFadeoutOnto',
  )(
    { self: this },
    function* (now: number, blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      yield* this.cleanupFiberToolkit.cancelCleanup
      yield* RestoreFullVolume.run(this.playback, now)
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.make({
        asset: this.asset,
        playback: this.playback,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
        cleanupFiberToolkit,
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
    },
  )

  scheduleNextPattern = Effect.fn(
    'PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.scheduleNextPattern',
  )(
    { self: this },
    function* (
      desiredAsset: TaggedPatternPointer,
      now: number,
      blissfulGridTimingsMath: BlissfulGridTimingsMath,
    ) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(desiredAsset)
      const playback = yield* ScheduleFadeIntoLoopPlayback.run(audioBuffer, {
        startAtSecond: now,
        bufferPhaseOffsetSeconds:
          blissfulGridTimingsMath.secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
        fadeInStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeInEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      return IncomingPatternFadingIn.make({
        asset: desiredAsset,
        playback,
        fadeInStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeInEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
      })
    },
  )

  dispose() {
    return disposeOf(this.playback)
  }
}

export const FadingOutPatternPlayback = Schema.Union([
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
])
export type FadingOutPatternPlayback = typeof FadingOutPatternPlayback.Type
