import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import {
  LoopBoundPlayback,
  type LoopSilenceHandoverState,
} from '../types/LoopBoundPlayback.ts'
import { getAudioNow } from '../types/loopElements.ts'
import { SilenceBoundPlayback } from '../types/SilenceBoundPlayback.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { Signal } from './signal.ts'

// Input during a pattern->silence->pattern state:
//   queue = [dying (long fade out to SILENCE), incoming (rolling in)].
// `incoming.asset` is the destination; `dying` is on its long stopping fade and
// is never re-anchored — it just finishes dying. Same reschedule-vs-append logic
// as advancePatternPatternTransition, keyed on whether `incoming`'s roll-over has
// committed yet, but `dying` keeps its independent silence slot throughout.
export const advancePatternSilencePatternTransition = Effect.fn(
  'advancePatternSilencePatternTransition',
)(function* (oldState: LoopSilenceHandoverState, signal: Signal) {
  const [dying, incoming] = oldState.transitionQueue

  // Re-selecting the destination's own accord/strength changes nothing.
  if (
    (AccordData.models(signal) && signal.accord === incoming.asset.accord) ||
    (StrengthData.models(signal) && signal.strength === incoming.asset.strength)
  )
    return oldState

  const now = yield* getAudioNow

  // Green = still buffer time before `incoming`'s roll-over commits.
  const isInGreenZone =
    now <= incoming.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

  // Pressing the destination pattern again toggles it off -> it heads to silence
  // too, joining `dying`.
  if (PatternData.models(signal) && signal.pattern === incoming.asset.pattern) {
    if (isInGreenZone) {
      // Drop the incoming loop; `dying` keeps fading out to silence alone.
      yield* incoming.drop()
      return SilenceBoundPlayback.make({
        // playbackStartedAtSecond: dying.playbackStartedAtSecond,
        accord: incoming.asset.accord,
        strength: incoming.asset.strength,
        transitionQueue: [dying],
      })
    }
    // Red: `incoming` is committed — fade it out to silence too (the LONG stopping
    // fade). Both loops now fade to silence; `dying` is untouched.
    return SilenceBoundPlayback.make({
      // playbackStartedAtSecond: dying.playbackStartedAtSecond,
      accord: incoming.asset.accord,
      strength: incoming.asset.strength,
      transitionQueue: [dying, yield* incoming.promoteToFadeToSilence()],
    })
  }

  const desiredAsset = desiredAssetFromSignal(signal, incoming.asset)

  // Heading back to the loop that is fading out to silence: while still green we
  // can revive it — cancel its stopping fade, restore full, drop `incoming`.
  if (isInGreenZone && Equal.equals(desiredAsset, dying.asset)) {
    const revived = yield* dying.cancelFadeoutAndRestore()
    yield* incoming.drop()
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: revived.playbackStartedAtSecond,
      transitionQueue: [revived],
    })
  }

  if (!isInGreenZone) {
    // Red: `incoming` is committed — it becomes the audible loop, so it now
    // crossfades OUT (roll-over) to the newly desired loop appended as a third.
    // `dying` is left exactly as-is on its silence fade.
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: dying.playbackStartedAtSecond,
      transitionQueue: [
        dying,
        yield* incoming.promoteToFadingOut(),
        yield* dying.scheduleNextLoop(desiredAsset),
      ],
    })
  }

  // Green: replace the incoming loop with the newly desired one. `dying` keeps its
  // silence fade untouched (the two never shared a slot here).
  yield* incoming.drop()
  return LoopBoundPlayback.make({
    playbackStartedAtSecond: dying.playbackStartedAtSecond,
    transitionQueue: [dying, yield* dying.scheduleNextLoop(desiredAsset)],
  })
})
