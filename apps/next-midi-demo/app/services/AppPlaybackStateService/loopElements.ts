import * as Effect from 'effect/Effect'
import { apply, flow } from 'effect/Function'
import * as Schema from 'effect/Schema'

import {
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../AudioBufferStore.ts'
import { CleanupFiberMaker } from './CleanupFiberMaker.ts'
import { CleanupFiberToolkit } from './CleanupFiberToolkit.ts'
import { AudioPlayback } from './common.ts'
import type { calcBlissfulGridTimingsMath } from './timingsMath.ts'
import { DisposePlayback } from './webAudioSideEffects/DisposePlayback.ts'
import { GetAudioNow } from './webAudioSideEffects/GetAudioNow.ts'
import { RestoreFullVolume } from './webAudioSideEffects/RestoreFullVolume.ts'
import { ScheduleFadeOut } from './webAudioSideEffects/ScheduleFadeOut.ts'
import { ScheduleIncomingPattern } from './webAudioSideEffects/ScheduleIncomingPattern.ts'

interface FadingOutPatternFields {
  readonly asset: TaggedPatternPointer
  readonly playback: AudioPlayback
  readonly playbackStartedAtSecond: number
  readonly cleanupFiberToolkit: CleanupFiberToolkit
}

export const getAudioNow = GetAudioNow.run()

export type BlissfulGridTimingsMath = ReturnType<typeof calcBlissfulGridTimingsMath>

const schedulePatternPatternFadeout = Effect.fn(
  'schedulePatternPatternFadeout',
)(function* (
  playback: AudioPlayback,
  asset: TaggedPatternPointer,
  playbackStartedAtSecond: number,
  blissfulGridTimingsMath: BlissfulGridTimingsMath,
) {
  yield* ScheduleFadeOut.run(playback, blissfulGridTimingsMath)
  const cleanupFiberToolkit = yield* Effect.flatMap(
    CleanupFiberMaker,
    apply(
      blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
    ),
  )
  return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.make({
    asset,
    playback,
    playbackStartedAtSecond,
    cleanupFiberToolkit,
    fadeoutStartsAtSecond:
      blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
    fadeoutEndsAtSecond:
      blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
  })
})

const scheduleSilenceFadeout = Effect.fn('scheduleSilenceFadeout')(function* (
  playback: AudioPlayback,
  asset: TaggedPatternPointer,
  playbackStartedAtSecond: number,
  blissfulGridTimingsMath: BlissfulGridTimingsMath,
) {
  yield* ScheduleFadeOut.run(playback, blissfulGridTimingsMath)
  const cleanupFiberToolkit = yield* Effect.flatMap(
    CleanupFiberMaker,
    apply(
      blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
    ),
  )
  return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.make({
    asset,
    playback,
    playbackStartedAtSecond,
    cleanupFiberToolkit,
    fadeoutStartsAtSecond:
      blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
    fadeoutEndsAtSecond:
      blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
  })
})

const scheduleIncomingPattern = Effect.fn('scheduleIncomingPattern')(function* (
  playbackStartedAtSecond: number,
  asset: TaggedPatternPointer,
  now: number,
  blissfulGridTimingsMath: BlissfulGridTimingsMath,
) {
  const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
  const playback = yield* ScheduleIncomingPattern.run(audioBuffer, {
    startAtSecond: now,
    bufferPhaseOffsetSeconds:
      blissfulGridTimingsMath.secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
    patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit:
      blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
    patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit:
      blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
  })
  return IncomingPatternFadingIn.make({
    asset,
    playback,
    fadeInStartsAtSecond:
      blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
    fadeInEndsAtSecond:
      blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
    playbackStartedAtSecond,
  })
})

const reviveToPlaying = Effect.fn('reviveToPlaying')(function* (
  el: FadingOutPatternFields,
  now: number,
) {
  yield* RestoreFullVolume.run(el.playback, now)
  yield* el.cleanupFiberToolkit.cancelCleanup
  return PatternPlayback.make({
    asset: el.asset,
    playback: el.playback,
    playbackStartedAtSecond: el.playbackStartedAtSecond,
  })
})

const reanchorToPatternPattern = Effect.fn('reanchorToPatternPattern')(
  function* (
    el: FadingOutPatternFields,
    now: number,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) {
    yield* el.cleanupFiberToolkit.cancelCleanup
    yield* RestoreFullVolume.run(el.playback, now)
    return yield* schedulePatternPatternFadeout(
      el.playback,
      el.asset,
      el.playbackStartedAtSecond,
      blissfulGridTimingsMath,
    )
  },
)

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

  beginShortFadeoutBeforeAnotherPattern(
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) {
    return schedulePatternPatternFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
      blissfulGridTimingsMath,
    )
  }

  beginLongFadeoutToSilence(blissfulGridTimingsMath: BlissfulGridTimingsMath) {
    return scheduleSilenceFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
      blissfulGridTimingsMath,
    )
  }

  scheduleNextPattern(
    desiredAsset: TaggedPatternPointer,
    now: number,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) {
    return scheduleIncomingPattern(
      this.playbackStartedAtSecond,
      desiredAsset,
      now,
      blissfulGridTimingsMath,
    )
  }
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
}

const disposeOf = Effect.fn('disposeOf')(
  flow(DisposePlayback.run, Effect.as(DisposedPatternPlayback.make({}))),
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

  promoteToFadingOut(blissfulGridTimingsMath: BlissfulGridTimingsMath) {
    return schedulePatternPatternFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
      blissfulGridTimingsMath,
    )
  }

  promoteToFadeToSilence(blissfulGridTimingsMath: BlissfulGridTimingsMath) {
    return scheduleSilenceFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
      blissfulGridTimingsMath,
    )
  }

  becomeLive() {
    return PatternPlayback.make({
      asset: this.asset,
      playback: this.playback,
      playbackStartedAtSecond: this.playbackStartedAtSecond,
    })
  }
}

export class PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern extends Schema.TaggedClass<PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern>()(
  'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    fadeoutStartsAtSecond: Schema.Finite,
    fadeoutEndsAtSecond: Schema.Finite,
    playbackStartedAtSecond: Schema.Finite,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  cancelFadeoutAndRestore(now: number) {
    return reviveToPlaying(this, now)
  }

  reanchorFadeoutOnto(now: number, blissfulGridTimingsMath: BlissfulGridTimingsMath) {
    return reanchorToPatternPattern(this, now, blissfulGridTimingsMath)
  }

  scheduleNextPattern(
    desiredAsset: TaggedPatternPointer,
    now: number,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) {
    return scheduleIncomingPattern(
      this.playbackStartedAtSecond,
      desiredAsset,
      now,
      blissfulGridTimingsMath,
    )
  }

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
    fadeoutEndsAtSecond: Schema.Finite,
    playbackStartedAtSecond: Schema.Finite,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  cancelFadeoutAndRestore(now: number) {
    return reviveToPlaying(this, now)
  }

  reanchorFadeoutOnto(now: number, blissfulGridTimingsMath: BlissfulGridTimingsMath) {
    return reanchorToPatternPattern(this, now, blissfulGridTimingsMath)
  }

  scheduleNextPattern(
    desiredAsset: TaggedPatternPointer,
    now: number,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) {
    return scheduleIncomingPattern(
      this.playbackStartedAtSecond,
      desiredAsset,
      now,
      blissfulGridTimingsMath,
    )
  }

  dispose() {
    return disposeOf(this.playback)
  }
}

export const FadingOutPatternPlayback = Schema.Union([
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
])
export type FadingOutPatternPlayback = typeof FadingOutPatternPlayback.Type
