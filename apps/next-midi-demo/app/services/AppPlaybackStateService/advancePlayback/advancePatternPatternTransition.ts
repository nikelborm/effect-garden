import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { PatternPatternPatternTransition } from '../types/PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransition } from '../types/PatternPatternSilenceTransition.ts'
import { PatternPatternTransition } from '../types/PatternPatternTransition.ts'
import { PatternSilenceTransition } from '../types/PatternSilenceTransition.ts'
import { PlayingPattern } from '../types/PlayingPattern.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { Signal } from './signal.ts'

// A second input arrived while a loop->loop crossfade is still queued:
//   transitionQueue = [current (fading out), latest (fading in)].
// `latest.asset` is the destination the user is currently heading toward; the
// raw `latest.fadeIn*` seconds say when its crossfade commits.
//
// GREEN (still safely before `latest`'s crossfade commits): we can cancel /
// reschedule the incoming `latest` cleanly — replace the 2nd queue element.
// RED (the crossfade has effectively begun, `latest` is becoming the audible
// loop): we can no longer take `latest` back, so we promote it to a fading-out
// element and APPEND a third — `current` keeps its own already-scheduled
// fade-out + cleanup untouched, its fiber will collapse the queue one level.
export const advancePatternPatternTransition = Effect.fn(
  'advancePatternPatternTransition',
)(function* (oldState: PatternPatternTransition, signal: Signal) {
  const [current, latest] = oldState.transitionQueue

  // Re-selecting the destination's own accord/strength changes nothing.
  if (AccordData.models(signal) && signal.accord === latest.asset.accord)
    return oldState
  if (StrengthData.models(signal) && signal.strength === latest.asset.strength)
    return oldState

  const now = yield* EAudioContext.currentTimeFromContext

  // Green = still buffer time before `latest`'s fade-in commits.
  const isInGreenZone =
    now <= latest.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

  // Pressing the destination pattern again toggles it off -> head to silence.
  if (PatternData.models(signal) && signal.pattern === latest.asset.pattern) {
    if (isInGreenZone) {
      // Drop the incoming loop entirely; `current` keeps fading out to silence.
      yield* latest.drop()
      return new PatternSilenceTransition({
        playbackStartedAtSecond: oldState.playbackStartedAtSecond,
        accord: latest.asset.accord,
        strength: latest.asset.strength,
        transitionQueue: [current],
      })
    }
    // Red: `latest` is already coming up — fade it out too. Both loops now fade
    // to silence (`current` untouched, still on its original slot/fiber).
    return new PatternPatternSilenceTransition({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      accord: latest.asset.accord,
      strength: latest.asset.strength,
      transitionQueue: [current, yield* latest.promoteToFadingOut()],
    })
  }

  const desiredAsset = desiredAssetFromSignal(signal, latest.asset)

  // Heading back to the loop currently fading out. In the green zone we can
  // still cancel the switch outright and keep playing it; in the red zone it is
  // already going away, so it is just another append (handled below).
  if (isInGreenZone && Equal.equals(desiredAsset, current.asset)) {
    const revived = yield* current.cancelFadeoutAndRestore()
    yield* latest.drop()
    return new PlayingPattern({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      asset: revived.asset,
      playback: revived.playback,
    })
  }

  if (!isInGreenZone) {
    // Red: `latest` is committed — append the new loop as a third element,
    // promoting `latest` to fade out. `current` is left exactly as-is.
    return new PatternPatternPatternTransition({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        current,
        yield* latest.promoteToFadingOut(),
        yield* current.scheduleNextLoop(desiredAsset),
      ],
    })
  }

  // Green: retarget the incoming loop. Re-anchor `current`'s fade-out onto a
  // fresh slot and fade in the new loop there instead of the discarded `latest`.
  yield* latest.drop()
  return new PatternPatternTransition({
    playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    transitionQueue: [
      yield* current.reanchorFadeoutOnto(),
      yield* current.scheduleNextLoop(desiredAsset),
    ],
  })
})
