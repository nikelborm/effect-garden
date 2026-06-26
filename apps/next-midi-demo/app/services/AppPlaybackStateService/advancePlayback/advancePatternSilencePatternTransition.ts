import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { PatternPatternPatternTransition } from '../types/PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransition } from '../types/PatternPatternSilenceTransition.ts'
import { PatternSilencePatternTransition } from '../types/PatternSilencePatternTransition.ts'
import { PatternSilenceTransition } from '../types/PatternSilenceTransition.ts'
import { PlayingPattern } from '../types/PlayingPattern.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { Signal } from './signal.ts'

// Input during a pattern->silence->pattern state:
//   transitionQueue = [dying (fading out to SILENCE), incoming (rolling in)].
// `incoming.asset` is the destination; `dying` is on its long stopping fade and
// is never re-anchored — it just finishes dying. Same reschedule-vs-append
// logic as advancePatternPatternTransition, keyed on whether `incoming`'s
// roll-over has committed yet.
export const advancePatternSilencePatternTransition = Effect.fn(
  'advancePatternSilencePatternTransition',
)(function* (oldState: PatternSilencePatternTransition, signal: Signal) {
  const [dying, incoming] = oldState.transitionQueue

  // Re-selecting the destination's own accord/strength changes nothing.
  if (AccordData.models(signal) && signal.accord === incoming.asset.accord)
    return oldState
  if (
    StrengthData.models(signal) &&
    signal.strength === incoming.asset.strength
  )
    return oldState

  const now = yield* EAudioContext.currentTimeFromContext

  // Green = still buffer time before `incoming`'s roll-over commits.
  const isInGreenZone =
    now <= incoming.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

  // Pressing the destination pattern again toggles it off -> it heads to
  // silence too, joining `dying`.
  if (PatternData.models(signal) && signal.pattern === incoming.asset.pattern) {
    if (isInGreenZone) {
      // Drop the incoming loop; `dying` keeps fading out to silence alone.
      yield* incoming.drop()
      return new PatternSilenceTransition({
        playbackStartedAtSecond: oldState.playbackStartedAtSecond,
        accord: incoming.asset.accord,
        strength: incoming.asset.strength,
        transitionQueue: [dying],
      })
    }
    // Red: `incoming` is committed — fade it out to silence too (the long
    // stopping fade). Both loops now fade to silence; `dying` is untouched.
    return new PatternPatternSilenceTransition({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
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
    return new PlayingPattern({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      asset: revived.asset,
      playback: revived.playback,
    })
  }

  if (!isInGreenZone) {
    // Red: `incoming` is committed — it becomes the audible loop, so it now
    // crossfades OUT (roll-over) to the newly desired loop appended as a third.
    // `dying` is left exactly as-is on its silence fade.
    return new PatternPatternPatternTransition({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        dying,
        yield* incoming.promoteToFadingOut(),
        yield* dying.scheduleNextLoop(desiredAsset),
      ],
    })
  }

  // Green: replace the incoming loop with the newly desired one. `dying` keeps
  // its silence fade untouched (the two never shared a slot here).
  yield* incoming.drop()
  return new PatternSilencePatternTransition({
    playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    transitionQueue: [dying, yield* dying.scheduleNextLoop(desiredAsset)],
  })
})
