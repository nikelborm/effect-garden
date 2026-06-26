import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import { apply } from 'effect/Function'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { fadeToSilenceTimeInSeconds, maxLoudness } from '../constants.ts'
import { createScheduledNextPlaybackInContext } from '../playbackNodes/createScheduledNextPlayback.ts'
import {
  helpGarbageCollectionOfPlayback,
  scheduleFadeOutOf,
} from '../playbackNodes/index.ts'
import { chosenSlot, zoneAt } from '../zones.ts'
import { AudioPlayback, CleanupFiberToolkit } from './common.ts'

// The lifecycle of a single loop playback, modelled as a small state machine of
// its own. Each class exposes ONLY the transitions that are legal from it, and
// each transition method performs the real audio/scheduler/cleanup side-effects
// internally and hands back the next element. The advancers pick which
// transition to call and assemble the returned elements into a new global state
// snapshot — they never touch gain ramps, the scheduler, or cleanup fibers
// directly, so a fade can't be scheduled without its cleanup, nor cancelled
// without un-arming it.
//
// Every element carries its own grid origin (`playbackStartedAtSecond`), so a
// method can compute its own scheduling Slot via `zoneAt`/`chosenSlot` from just
// the current time. NOTE: when two methods schedule against the same boundary in
// one advance (e.g. a loop fading out while its replacement fades in), they each
// read `currentTime` independently. WebAudio's `currentTime` is quantised to the
// render quantum and both reads happen in the same synchronous burst, so they
// land on the same Slot in practice; the 30ms scheduling safety buffer makes the
// zone decision stable across that window. If crossfades ever audibly drift,
// this is the place to thread a single shared `now`.

interface FadingOutLoopFields {
  readonly asset: TaggedPatternPointer
  readonly playback: AudioPlayback
  readonly playbackStartedAtSecond: number
  readonly cleanupFiberToolkit: CleanupFiberToolkit
}

// Restore a fading loop to full volume right now, wiping any scheduled ramp.
const restoreToFullVolume = (playback: AudioPlayback, now: number) =>
  Effect.sync(() => {
    playback.gainNode.gain.cancelScheduledValues(now)
    playback.gainNode.gain.setValueAtTime(maxLoudness, now)
  })

// Stop & GC the underlying nodes, yielding the terminal sentinel.
const disposeOf = (playback: AudioPlayback) =>
  Effect.as(
    helpGarbageCollectionOfPlayback(playback),
    DisposedLoopPlayback.make({}),
  )

// Schedule the near-instant roll-over fade-out on the next free tick and arm the
// cleanup fiber that collapses the queue once this loop is gone.
const scheduleRolloverFadeout = (
  playback: AudioPlayback,
  asset: TaggedPatternPointer,
  playbackStartedAtSecond: number,
) =>
  Effect.gen(function* () {
    const now = yield* EAudioContext.currentTimeFromContext
    const slot = chosenSlot(zoneAt(playbackStartedAtSecond, now))
    yield* scheduleFadeOutOf(playback, slot)
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

// Schedule the long, audible fade to silence and arm its cleanup fiber.
const scheduleSilenceFadeout = (
  playback: AudioPlayback,
  asset: TaggedPatternPointer,
  playbackStartedAtSecond: number,
) =>
  Effect.gen(function* () {
    const now = yield* EAudioContext.currentTimeFromContext
    const slot = chosenSlot(
      zoneAt(playbackStartedAtSecond, now, fadeToSilenceTimeInSeconds),
    )
    yield* scheduleFadeOutOf(playback, slot)
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

// Create & schedule a brand-new loop for `asset`, rolling in on the next free
// tick of the grid anchored at `playbackStartedAtSecond`. Fetches the buffer +
// current time from context. Backs `scheduleNextLoop` on whichever element owns
// the grid we're rolling the new loop onto.
const scheduleIncomingLoop = (
  playbackStartedAtSecond: number,
  asset: TaggedPatternPointer,
) =>
  Effect.gen(function* () {
    const audioBuffer = yield* (yield* AudioBufferStore).getByAsset(asset)
    const now = yield* EAudioContext.currentTimeFromContext
    const zone = zoneAt(playbackStartedAtSecond, now)
    const slot = chosenSlot(zone)
    const playback = yield* createScheduledNextPlaybackInContext(audioBuffer, {
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

// Cancel a scheduled fade-out, restore full volume, and un-arm the cleanup fiber
// — back to a plain live loop. The invariant the user named: cancelling a fade
// can't leave a stale cleanup fiber behind.
const reviveToPlaying = (el: FadingOutLoopFields) =>
  Effect.gen(function* () {
    const now = yield* EAudioContext.currentTimeFromContext
    yield* restoreToFullVolume(el.playback, now)
    yield* el.cleanupFiberToolkit.cancelCleanup
    return PlayingLoopPlayback.make({
      asset: el.asset,
      playback: el.playback,
      playbackStartedAtSecond: el.playbackStartedAtSecond,
    })
  })

// Re-anchor a fading loop's fade-out onto a fresh roll-over slot: drop the old
// cleanup, restore full volume, then schedule a new roll-over fade with a fresh
// cleanup fiber. Used when the user retargets mid-transition.
const reanchorToRollover = (el: FadingOutLoopFields) =>
  Effect.gen(function* () {
    const now = yield* EAudioContext.currentTimeFromContext
    yield* el.cleanupFiberToolkit.cancelCleanup
    yield* restoreToFullVolume(el.playback, now)
    return yield* scheduleRolloverFadeout(
      el.playback,
      el.asset,
      el.playbackStartedAtSecond,
    )
  })

// Terminal: the loop's nodes have been stopped & disconnected. Never stored in a
// queue — a `.drop()`/`.dispose()` returns it and the advancer simply omits it
// from the new tuple.
export class DisposedLoopPlayback extends Schema.TaggedClass<DisposedLoopPlayback>()(
  'DisposedLoopPlayback',
  {},
) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

// A loop sounding at full volume.
export class PlayingLoopPlayback extends Schema.TaggedClass<PlayingLoopPlayback>()(
  'PlayingLoopPlayback',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    playbackStartedAtSecond: Schema.Number,
  },
) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  // Hand over to another loop on the next tick (near-instant roll-over).
  beginShortFadeoutBeforeAnotherLoop() {
    return scheduleRolloverFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
    )
  }

  // Stop into silence with the long, audible fade.
  beginLongFadeoutToSilence() {
    return scheduleSilenceFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
    )
  }

  // Spawn a brand-new loop rolling in on this loop's grid — e.g. while this loop
  // begins fading out to hand over to it.
  scheduleNextLoop(desiredAsset: TaggedPatternPointer) {
    return scheduleIncomingLoop(this.playbackStartedAtSecond, desiredAsset)
  }
}

// An incoming loop scheduled to roll in: silent until its fade-in window, fully
// audible by `fadeInEndsAtSecond`. Not yet committed to cleanup.
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
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  // Green-zone discard: the roll-over hasn't committed, so stop & GC outright.
  drop() {
    return disposeOf(this.playback)
  }

  // Red-zone: this loop has committed and is becoming audible, so it can't be
  // taken back — promote it to a roll-over fade-out into the next loop.
  promoteToFadingOut() {
    return scheduleRolloverFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
    )
  }

  // Red-zone toward silence: committed, but the destination is now silence — fade
  // it out with the long stopping fade instead of a roll-over.
  promoteToFadeToSilence() {
    return scheduleSilenceFadeout(
      this.playback,
      this.asset,
      this.playbackStartedAtSecond,
    )
  }

  // The crossfade completed and this loop is now the live one. Pure
  // reclassification — its fade-in ramp was scheduled at creation.
  becomeLive() {
    return PlayingLoopPlayback.make({
      asset: this.asset,
      playback: this.playback,
      playbackStartedAtSecond: this.playbackStartedAtSecond,
    })
  }
}

// A loop on its near-instant roll-over fade-out, handing over to another loop on
// the next tick. Carries its cleanup fiber, which will collapse the queue once
// it is gone.
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
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  cancelFadeoutAndRestore() {
    return reviveToPlaying(this)
  }

  reanchorFadeoutOnto() {
    return reanchorToRollover(this)
  }

  // Spawn a brand-new loop rolling in on this loop's grid (this loop keeps the
  // fade it already has — e.g. a dying loop crossfading into its replacement).
  scheduleNextLoop(desiredAsset: TaggedPatternPointer) {
    return scheduleIncomingLoop(this.playbackStartedAtSecond, desiredAsset)
  }

  dispose() {
    return disposeOf(this.playback)
  }
}

// A loop on its last play: the long, audible fade to silence. Same shape and
// transitions as the roll-over fade-out, but born from a longer fade window.
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
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  cancelFadeoutAndRestore() {
    return reviveToPlaying(this)
  }

  reanchorFadeoutOnto() {
    return reanchorToRollover(this)
  }

  // Spawn a brand-new loop rolling in on this loop's grid (this loop keeps the
  // fade it already has — e.g. a dying loop crossfading into its replacement).
  scheduleNextLoop(desiredAsset: TaggedPatternPointer) {
    return scheduleIncomingLoop(this.playbackStartedAtSecond, desiredAsset)
  }

  dispose() {
    return disposeOf(this.playback)
  }
}

// Any loop with a scheduled fade-out + cleanup fiber, regardless of fade length.
// The transition tuples reuse fading-out loops interchangeably (a long
// silence-fade can become a crossfade-out, a roll-over can end up heading to
// silence), so the queue slots hold this union; the incoming loop is the only
// element distinguished by its own type.
export const FadingOutLoopPlayback = Schema.Union(
  LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop,
  LoopPlaybackAtItsLastPlayWithScheduledLongFadeout,
)
export type FadingOutLoopPlayback = Schema.Schema.Type<
  typeof FadingOutLoopPlayback
>
