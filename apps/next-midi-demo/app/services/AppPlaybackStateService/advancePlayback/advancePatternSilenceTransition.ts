import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { LoopBoundPlayback } from '../types/LoopBoundPlayback.ts'
import {
  type LoopFadingToSilenceState,
  SilenceBoundPlayback,
} from '../types/SilenceBoundPlayback.ts'
import type { Signal } from './signal.ts'

// One loop is fading out to silence (queue = [current]); accord+strength are the
// carried base selection on oldState (they can diverge from `current.asset` once
// the user changes strength mid-fade, which is why oldState carries them).
export const advancePatternSilenceTransition = Effect.fn(
  'advancePatternSilenceTransition',
)(function* (oldState: LoopFadingToSilenceState, signal: Signal) {
  const { accord, strength } = oldState
  const [current] = oldState.transitionQueue

  // Strength just updates the base selection carried towards silence.
  if (StrengthData.models(signal))
    return SilenceBoundPlayback.make({
      playbackStartedAtSecond: current.playbackStartedAtSecond,
      accord,
      strength: signal.strength,
      transitionQueue: [current],
    })

  // From a (scheduled) silence, an accord press means "slow strum". Slow strums
  // are deferred for now — die honestly rather than pretend.
  if (AccordData.models(signal))
    return yield* Effect.dieMessage(
      'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
    )

  const now = yield* EAudioContext.currentTimeFromContext

  // Green zone = still buffer time before the fade-out begins, so we can safely
  // cancel/redirect it. Red zone = the fade has effectively started.
  const isInGreenZone =
    now <= current.fadeoutStartsAtSecond - schedulingSafeBufferInSeconds

  if (signal.pattern === current.asset.pattern) {
    if (!isInGreenZone)
      return yield* Effect.dieMessage(
        're-press of the same pattern during active fade-out: not yet handled',
      )
    // Same pattern, still time: cancel the scheduled silence and keep playing.
    const revived = yield* current.cancelFadeoutAndRestore()
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: revived.playbackStartedAtSecond,
      transitionQueue: [revived],
    })
  }

  // Different pattern pressed: a new loop rolls in on the next tick while
  // `current` keeps the fade it already has — its stopping fade doubles as a
  // clean crossfade. `current`'s long-fade tag records that it heads to silence,
  // so the resulting handover routes to advancePatternSilencePatternTransition.
  const asset = TaggedPatternPointer.make({
    pattern: signal.pattern,
    accord,
    strength,
  })
  const incoming = yield* current.scheduleNextLoop(asset)
  // The ternary only narrows `current`'s fade type so the [FadingOut, Incoming]
  // tuple lands on the right union member (roll-over vs to-silence handover);
  // both branches build the same pair.
  return LoopBoundPlayback.make({
    playbackStartedAtSecond: current.playbackStartedAtSecond,
    transitionQueue:
      current._tag === 'LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop'
        ? [current, incoming]
        : [current, incoming],
  })
})
