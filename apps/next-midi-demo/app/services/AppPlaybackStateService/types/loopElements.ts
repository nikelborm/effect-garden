import * as Effect from 'effect/Effect'
import { apply } from 'effect/Function'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { fadeToSilenceTimeInSeconds } from '../constants.ts'
import {
  DisposePlayback,
  GetAudioNow,
  RestoreFullVolume,
  ScheduleFadeOut,
  ScheduleIncomingLoop,
} from '../webAudioSideEffects/index.ts'
import { chosenSlot, zoneAt } from '../zones.ts'
import { AudioPlayback, CleanupFiberToolkit } from './common.ts'

interface FadingOutLoopFields {
  readonly asset: TaggedPatternPointer
  readonly playback: AudioPlayback
  readonly playbackStartedAtSecond: number
  readonly cleanupFiberToolkit: CleanupFiberToolkit
}

export const getAudioNow = GetAudioNow.run()

const disposeOf = (playback: AudioPlayback) =>
  Effect.as(DisposePlayback.run(playback), DisposedLoopPlayback.make({}))

const scheduleRolloverFadeout = (
  playback: AudioPlayback,
  asset: TaggedPatternPointer,
  playbackStartedAtSecond: number,
) =>
  Effect.gen(function* () {
    const now = yield* getAudioNow
    const slot = chosenSlot(zoneAt(playbackStartedAtSecond, now))
    yield* ScheduleFadeOut.run(playback, slot)
    const cleanupFiberToolkit = yield* Effect.flatMap(
      CleanupFiberMaker,
      apply(slot.fadeoutEndsAtSecond - now),
    )
    return LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop.make({
      asset,
      playback,
      playbackStartedAtSecond,
      cleanupFiberToolkit,
      fadeoutStartsAtSecond: slot.fadeoutStartsAtSecond,
      fadeoutEndsAtSecond: slot.fadeoutEndsAtSecond,
    })
  })

const scheduleSilenceFadeout = (
  playback: AudioPlayback,
  asset: TaggedPatternPointer,
  playbackStartedAtSecond: number,
) =>
  Effect.gen(function* () {
    const now = yield* getAudioNow
    const slot = chosenSlot(
      zoneAt(playbackStartedAtSecond, now, fadeToSilenceTimeInSeconds),
    )
    yield* ScheduleFadeOut.run(playback, slot)
    const cleanupFiberToolkit = yield* Effect.flatMap(
      CleanupFiberMaker,
      apply(slot.fadeoutEndsAtSecond - now),
    )
    return LoopPlaybackAtItsLastPlayWithScheduledLongFadeout.make({
      asset,
      playback,
      playbackStartedAtSecond,
      cleanupFiberToolkit,
      fadeoutStartsAtSecond: slot.fadeoutStartsAtSecond,
      fadeoutEndsAtSecond: slot.fadeoutEndsAtSecond,
    })
  })

const scheduleIncomingLoop = (
  playbackStartedAtSecond: number,
  asset: TaggedPatternPointer,
) =>
  Effect.gen(function* () {
    const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
    const now = yield* getAudioNow
    const zone = zoneAt(playbackStartedAtSecond, now)
    const slot = chosenSlot(zone)
    const playback = yield* ScheduleIncomingLoop.run(audioBuffer, {
      startAtSecond: now,
      bufferPhaseOffsetSeconds: zone.bufferPhaseOffsetSeconds,
      slot,
    })
    return IncomingLoopFadingIn.make({
      asset,
      playback,
      fadeInStartsAtSecond: slot.fadeoutStartsAtSecond,
      fadeInEndsAtSecond: slot.fadeoutEndsAtSecond,
      playbackStartedAtSecond,
    })
  })

const reviveToPlaying = (el: FadingOutLoopFields) =>
  Effect.gen(function* () {
    const now = yield* getAudioNow
    yield* RestoreFullVolume.run(el.playback, now)
    yield* el.cleanupFiberToolkit.cancelCleanup
    return PlayingLoopPlayback.make({
      asset: el.asset,
      playback: el.playback,
      playbackStartedAtSecond: el.playbackStartedAtSecond,
    })
  })

const reanchorToRollover = (el: FadingOutLoopFields) =>
  Effect.gen(function* () {
    const now = yield* getAudioNow
    yield* el.cleanupFiberToolkit.cancelCleanup
    yield* RestoreFullVolume.run(el.playback, now)
    return yield* scheduleRolloverFadeout(
      el.playback,
      el.asset,
      el.playbackStartedAtSecond,
    )
  })

export class DisposedLoopPlayback extends Schema.TaggedClass<DisposedLoopPlayback>()(
  'DisposedLoopPlayback',
  {},
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

export class PlayingLoopPlayback extends Schema.TaggedClass<PlayingLoopPlayback>()(
  'PlayingLoopPlayback',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    playbackStartedAtSecond: Schema.Number,
  },
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  beginShortFadeoutBeforeAnotherLoop() {
    return scheduleRolloverFadeout(
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

  scheduleNextLoop(desiredAsset: TaggedPatternPointer) {
    return scheduleIncomingLoop(this.playbackStartedAtSecond, desiredAsset)
  }
}

export class IncomingLoopFadingIn extends Schema.TaggedClass<IncomingLoopFadingIn>()(
  'IncomingLoopFadingIn',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    fadeInStartsAtSecond: Schema.Number,
    fadeInEndsAtSecond: Schema.Number,
    playbackStartedAtSecond: Schema.Number,
  },
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  drop() {
    return disposeOf(this.playback)
  }

  promoteToFadingOut() {
    return scheduleRolloverFadeout(
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
    return PlayingLoopPlayback.make({
      asset: this.asset,
      playback: this.playback,
      playbackStartedAtSecond: this.playbackStartedAtSecond,
    })
  }
}

export class LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop extends Schema.TaggedClass<LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop>()(
  'LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    fadeoutStartsAtSecond: Schema.Number,
    fadeoutEndsAtSecond: Schema.Number,
    playbackStartedAtSecond: Schema.Number,
  },
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  cancelFadeoutAndRestore() {
    return reviveToPlaying(this)
  }

  reanchorFadeoutOnto() {
    return reanchorToRollover(this)
  }

  scheduleNextLoop(desiredAsset: TaggedPatternPointer) {
    return scheduleIncomingLoop(this.playbackStartedAtSecond, desiredAsset)
  }

  dispose() {
    return disposeOf(this.playback)
  }
}

export class LoopPlaybackAtItsLastPlayWithScheduledLongFadeout extends Schema.TaggedClass<LoopPlaybackAtItsLastPlayWithScheduledLongFadeout>()(
  'LoopPlaybackAtItsLastPlayWithScheduledLongFadeout',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    fadeoutStartsAtSecond: Schema.Number,
    fadeoutEndsAtSecond: Schema.Number,
    playbackStartedAtSecond: Schema.Number,
  },
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  cancelFadeoutAndRestore() {
    return reviveToPlaying(this)
  }

  reanchorFadeoutOnto() {
    return reanchorToRollover(this)
  }

  scheduleNextLoop(desiredAsset: TaggedPatternPointer) {
    return scheduleIncomingLoop(this.playbackStartedAtSecond, desiredAsset)
  }

  dispose() {
    return disposeOf(this.playback)
  }
}

export const FadingOutLoopPlayback = Schema.Union(
  LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop,
  LoopPlaybackAtItsLastPlayWithScheduledLongFadeout,
)
export type FadingOutLoopPlayback = typeof FadingOutLoopPlayback.Type
