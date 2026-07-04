import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import {
  LoopBoundPlayback,
  type LoopRolloverHandoverState,
} from '../types/LoopBoundPlayback.ts'
import { getAudioNow } from '../types/loopElements.ts'
import { SilenceBoundPlayback } from '../types/SilenceBoundPlayback.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { Signal } from './signal.ts'

// A second input arrived while a loop->loop ROLL-OVER is still queued:
//   queue = [current (short roll-over fade), incoming (fading in)].
// `incoming.asset` is the destination; `incoming.fadeIn*` say when its crossfade
// commits. GREEN (still safely before it commits): cancel / reschedule `incoming`
// cleanly. RED (the crossfade has effectively begun): we can't take `incoming`
// back, so we promote it to a fading-out element and append a third — `current`
// keeps its own fade + cleanup untouched.
export const advancePatternPatternTransition = Effect.fn(
  'advancePatternPatternTransition',
)(function* (oldState: LoopRolloverHandoverState, signal: Signal) {
  const [current, incoming] = oldState.transitionQueue

  // Re-selecting the destination's own accord/strength changes nothing.
  if (
    (AccordData.models(signal) && signal.accord === incoming.asset.accord) ||
    (StrengthData.models(signal) && signal.strength === incoming.asset.strength)
  )
    return oldState

  const now = yield* getAudioNow

  // Green = still buffer time before `incoming`'s fade-in commits.
  const isInGreenZone =
    now <= incoming.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

  // Pressing the destination pattern again toggles it off -> head to silence.
  if (PatternData.models(signal) && signal.pattern === incoming.asset.pattern) {
    if (isInGreenZone) {
      // Drop the incoming loop entirely; `current` keeps fading out to silence.
      yield* incoming.drop()
      return SilenceBoundPlayback.make({
        // playbackStartedAtSecond: current.playbackStartedAtSecond,
        accord: incoming.asset.accord,
        strength: incoming.asset.strength,
        transitionQueue: [current],
      })
    }
    // Red: `incoming` is already coming up — fade it out too (SHORT fade — the
    // preserved roll-over inconsistency; see midi_scheduling_findings). Both
    // loops now fade to silence; `current` untouched on its original slot/fiber.
    return SilenceBoundPlayback.make({
      // playbackStartedAtSecond: current.playbackStartedAtSecond,
      accord: incoming.asset.accord,
      strength: incoming.asset.strength,
      transitionQueue: [current, yield* incoming.promoteToFadingOut()],
    })
  }

  const desiredAsset = desiredAssetFromSignal(signal, incoming.asset)

  // Heading back to the loop currently fading out. In the green zone we can still
  // cancel the switch outright and keep playing it.
  if (isInGreenZone && Equal.equals(desiredAsset, current.asset)) {
    const revived = yield* current.cancelFadeoutAndRestore()
    yield* incoming.drop()
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: revived.playbackStartedAtSecond,
      transitionQueue: [revived],
    })
  }

  if (!isInGreenZone) {
    // Red: `incoming` is committed — append the new loop as a third element,
    // promoting `incoming` to fade out. `current` is left exactly as-is.
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: current.playbackStartedAtSecond,
      transitionQueue: [
        current,
        yield* incoming.promoteToFadingOut(),
        yield* current.scheduleNextLoop(desiredAsset),
      ],
    })
  }

  // Green: retarget the incoming loop. Re-anchor `current`'s fade-out onto a fresh
  // slot (it shared a slot with the now-discarded `incoming`) and fade in the new
  // loop there instead.
  yield* incoming.drop()
  return LoopBoundPlayback.make({
    playbackStartedAtSecond: current.playbackStartedAtSecond,
    transitionQueue: [
      yield* current.reanchorFadeoutOnto(),
      yield* current.scheduleNextLoop(desiredAsset),
    ],
  })
})
