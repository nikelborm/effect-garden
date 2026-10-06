import * as Effect from 'effect/Effect'
import { apply, flow } from 'effect/Function'
import * as Schema from 'effect/Schema'

import {
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { CleanupFiberToolkit } from '../CleanupFiberToolkit.ts'
import { fadeToSilenceTimeInSeconds } from '../constants.ts'
import { DisposePlayback } from '../webAudioSideEffects/DisposePlayback.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
import { RestoreFullVolume } from '../webAudioSideEffects/RestoreFullVolume.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { ScheduleIncomingPattern } from '../webAudioSideEffects/ScheduleIncomingPattern.ts'
import { chosenSlot, zoneAt } from '../zones.ts'
import { AudioPlayback } from './common.ts'

interface FadingOutPatternFields {
  readonly asset: TaggedPatternPointer
  readonly playback: AudioPlayback
  readonly playbackStartedAtSecond: number
  readonly cleanupFiberToolkit: CleanupFiberToolkit
}

export const getAudioNow = GetAudioNow.run()

const schedulePatternPatternFadeout = Effect.fn(
  'schedulePatternPatternFadeout',
)(function* (
  playback: AudioPlayback,
  asset: TaggedPatternPointer,
  playbackStartedAtSecond: number,
) {
  const now = yield* getAudioNow
  const slot = chosenSlot(zoneAt(playbackStartedAtSecond, now))
  yield* ScheduleFadeOut.run(playback, slot)
  const cleanupFiberToolkit = yield* Effect.flatMap(
    CleanupFiberMaker,
    apply(slot.fadeoutEndsAtSecond - now),
  )
  return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.make({
    asset,
    playback,
    playbackStartedAtSecond,
    cleanupFiberToolkit,
    fadeoutStartsAtSecond: slot.fadeoutStartsAtSecond,
    fadeoutEndsAtSecond: slot.fadeoutEndsAtSecond,
  })
})

const scheduleSilenceFadeout = Effect.fn('scheduleSilenceFadeout')(function* (
  playback: AudioPlayback,
  asset: TaggedPatternPointer,
  playbackStartedAtSecond: number,
) {
  const now = yield* getAudioNow
  const slot = chosenSlot(
    zoneAt(playbackStartedAtSecond, now, fadeToSilenceTimeInSeconds),
  )
  yield* ScheduleFadeOut.run(playback, slot)
  const cleanupFiberToolkit = yield* Effect.flatMap(
    CleanupFiberMaker,
    apply(slot.fadeoutEndsAtSecond - now),
  )
  return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.make({
    asset,
    playback,
    playbackStartedAtSecond,
    cleanupFiberToolkit,
    fadeoutStartsAtSecond: slot.fadeoutStartsAtSecond,
    fadeoutEndsAtSecond: slot.fadeoutEndsAtSecond,
  })
})

const scheduleIncomingPattern = Effect.fn('scheduleIncomingPattern')(function* (
  playbackStartedAtSecond: number,
  asset: TaggedPatternPointer,
) {
  const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
  const now = yield* getAudioNow
  const zone = zoneAt(playbackStartedAtSecond, now)
  const slot = chosenSlot(zone)
  const playback = yield* ScheduleIncomingPattern.run(audioBuffer, {
    startAtSecond: now,
    bufferPhaseOffsetSeconds: zone.bufferPhaseOffsetSeconds,
    slot,
  })
  return IncomingPatternFadingIn.make({
    asset,
    playback,
    fadeInStartsAtSecond: slot.fadeoutStartsAtSecond,
    fadeInEndsAtSecond: slot.fadeoutEndsAtSecond,
    playbackStartedAtSecond,
  })
})

const reviveTo = Effect.fn('reviveTo')(function* (el: FadingOutPatternFields) {
  const now = yield* getAudioNow
  yield* RestoreFullVolume.run(el.playback, now)
  yield* el.cleanupFiberToolkit.cancelCleanup
  return PatternPlayback.make({
    asset: el.asset,
    playback: el.playback,
    playbackStartedAtSecond: el.playbackStartedAtSecond,
  })
})

const reanchorToPatternPattern = Effect.fn('reanchorToPatternPattern')(
  function* (el: FadingOutPatternFields) {
    const now = yield* getAudioNow
    yield* el.cleanupFiberToolkit.cancelCleanup
    yield* RestoreFullVolume.run(el.playback, now)
    return yield* schedulePatternPatternFadeout(
      el.playback,
      el.asset,
      el.playbackStartedAtSecond,
    )
  },
)

export class PatternPlayback extends Schema.TaggedClass<PatternPlayback>()(
  'PatternPlayback',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    playbackStartedAtSecond: Schema.Number,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  beginShortFadeoutBeforeAnotherPattern() {
    return schedulePatternPatternFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
    )
  }

  beginLongFadeoutToSilence() {
    return scheduleSilenceFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
    )
  }

  scheduleNextPattern(desiredAsset: TaggedPatternPointer) {
    return scheduleIncomingPattern(this.playbackStartedAtSecond, desiredAsset)
  }
}

export class SlowStrumPlayback extends Schema.TaggedClass<SlowStrumPlayback>()(
  'SlowStrumPlayback',
  {
    playbackStartedAtSecond: Schema.Number,
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
    fadeInStartsAtSecond: Schema.Number,
    fadeInEndsAtSecond: Schema.Number,
    playbackStartedAtSecond: Schema.Number,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  drop() {
    return disposeOf(this.playback)
  }

  promoteToFadingOut() {
    return schedulePatternPatternFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
    )
  }

  promoteToFadeToSilence() {
    return scheduleSilenceFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
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
    fadeoutStartsAtSecond: Schema.Number,
    fadeoutEndsAtSecond: Schema.Number,
    playbackStartedAtSecond: Schema.Number,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  cancelFadeoutAndRestore() {
    return reviveTo(this)
  }

  reanchorFadeoutOnto() {
    return reanchorToPatternPattern(this)
  }

  scheduleNextPattern(desiredAsset: TaggedPatternPointer) {
    return scheduleIncomingPattern(this.playbackStartedAtSecond, desiredAsset)
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
    fadeoutStartsAtSecond: Schema.Number,
    fadeoutEndsAtSecond: Schema.Number,
    playbackStartedAtSecond: Schema.Number,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  cancelFadeoutAndRestore() {
    return reviveTo(this)
  }

  reanchorFadeoutOnto() {
    return reanchorToPatternPattern(this)
  }

  scheduleNextPattern(desiredAsset: TaggedPatternPointer) {
    return scheduleIncomingPattern(this.playbackStartedAtSecond, desiredAsset)
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
