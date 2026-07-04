import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import {
  type FullLoopState,
  LoopBoundPlayback,
} from '../types/LoopBoundPlayback.ts'
import { getAudioNow } from '../types/loopElements.ts'
import { SilenceBoundPlayback } from '../types/SilenceBoundPlayback.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { Signal } from './signal.ts'

// The full transition queue [oldest, middle, incoming]: two loops are already
// fading out while `incoming` rolls in behind them, and now a 4th input arrived.
// `incoming` (queue[2]) is the destination and the ONLY element not yet
// committed — `oldest` and `middle` already own scheduled fades + cleanup fibers
// and are untouchable. So everything we can do here acts on `incoming`, which
// keeps the queue at <= 3. The genuinely excluded case is a RED-zone switch or
// deselect: that would have to promote `incoming` to a FOURTH fading element
// (or a THIRD fading-to-silence loop), which the 3-slot queue cannot represent —
// so those paths still die loudly. See midi_scheduling_findings_2026_06_25.
export const advancePatternPatternPatternTransition = Effect.fn(
  'advancePatternPatternPatternTransition',
)(function* (oldState: FullLoopState, signal: Signal) {
  const [oldest, middle, incoming] = oldState.transitionQueue

  // Re-selecting the destination's own accord/strength changes nothing.
  if (
    (AccordData.models(signal) && signal.accord === incoming.asset.accord) ||
    (StrengthData.models(signal) && signal.strength === incoming.asset.strength)
  )
    return oldState

  const now = yield* getAudioNow

  // Green = still buffer time before `incoming`'s fade-in commits, so we can
  // still drop or re-target it without ever growing the queue past 3.
  const isInGreenZone =
    now <= incoming.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

  // Pressing the destination pattern again toggles it off -> head to silence.
  if (PatternData.models(signal) && signal.pattern === incoming.asset.pattern) {
    if (isInGreenZone) {
      // Drop the not-yet-committed incoming loop; `oldest` and `middle` keep
      // fading out to silence on their own slots/fibers.
      yield* incoming.drop()
      return SilenceBoundPlayback.make({
        // playbackStartedAtSecond: oldest.playbackStartedAtSecond,
        accord: incoming.asset.accord,
        strength: incoming.asset.strength,
        transitionQueue: [oldest, middle],
      })
    }
    // Red: `incoming` has committed and would have to fade out too, leaving THREE
    // loops fading to silence — a shape the queue cannot hold. Excluded.
    yield* Effect.logError({ oldest, middle, incoming, signal })
    return yield* Effect.dieMessage(
      'red-zone deselect during a full queue (a 4th input): would need a 3rd fading-to-silence loop — excluded from the MVP',
    )
  }

  if (!isInGreenZone) {
    // Red: `incoming` has committed and cannot be taken back; switching now would
    // have to promote it to a 4th fading element. The queue holds only 3.
    yield* Effect.logError({ oldest, middle, incoming, signal })
    return yield* Effect.dieMessage(
      'red-zone switch during a full queue (a 4th input): would need a 4th queue element — excluded from the MVP',
    )
  }

  // Green: re-target. Drop the uncommitted incoming loop and schedule a fresh one
  // for the newly desired asset on the same grid; `oldest` and `middle` keep
  // their fades untouched. The queue stays full but valid.
  const desiredAsset = desiredAssetFromSignal(signal, incoming.asset)
  yield* incoming.drop()
  return LoopBoundPlayback.make({
    playbackStartedAtSecond: oldest.playbackStartedAtSecond,
    transitionQueue: [
      oldest,
      middle,
      yield* oldest.scheduleNextLoop(desiredAsset),
    ],
  })
})
