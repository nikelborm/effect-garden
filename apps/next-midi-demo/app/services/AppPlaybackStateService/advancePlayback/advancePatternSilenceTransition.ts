import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { PatternPatternTransition } from '../types/PatternPatternTransition.ts'
import { PatternSilencePatternTransition } from '../types/PatternSilencePatternTransition.ts'
import { PatternSilenceTransition } from '../types/PatternSilenceTransition.ts'
import { PlayingPattern } from '../types/PlayingPattern.ts'
import type { Signal } from './signal.ts'

export const advancePatternSilenceTransition = Effect.fn(
  'advancePatternSilenceTransition',
)(function* (oldState: PatternSilenceTransition, signal: Signal) {
  // Strength just updates the base selection carried towards silence.
  if (StrengthData.models(signal))
    return new PatternSilenceTransition({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      accord: oldState.accord,
      strength: signal.strength,
      transitionQueue: oldState.transitionQueue,
    })

  // From a (scheduled) silence, an accord press means "slow strum". Slow strums
  // are deferred for now — die honestly rather than pretend.
  if (AccordData.models(signal))
    return yield* Effect.dieMessage(
      'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
    )

  const [current] = oldState.transitionQueue
  const now = yield* EAudioContext.currentTimeFromContext

  // Green zone = we still have buffer time before the fade-out begins, so we can
  // safely cancel/redirect it. Red zone = the fade has effectively started.
  const isInGreenZone =
    now <= current.fadeoutStartsAtSecond - schedulingSafeBufferInSeconds

  const isSamePattern = signal.pattern === current.asset.pattern

  if (isSamePattern) {
    if (!isInGreenZone)
      return yield* Effect.dieMessage(
        're-press of the same pattern during active fade-out: not yet handled',
      )

    // Same pattern, still time: cancel the scheduled silence and keep playing.
    const revived = yield* current.cancelFadeoutAndRestore()
    return new PlayingPattern({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      asset: revived.asset,
      playback: revived.playback,
    })
  }

  // Different pattern pressed. Either way a new loop rolls in (a short
  // roll-over) on the next tick while `current` keeps the fade it already has;
  // `current`'s existing cleanup fiber collapses the result to PlayingPattern.
  const asset = TaggedPatternPointer.make({
    pattern: signal.pattern,
    accord: oldState.accord,
    strength: oldState.strength,
  })
  const incoming = yield* current.scheduleNextLoop(asset)

  // Green: `current`'s fade hasn't begun, so its (stopping) fade-out doubles as
  // a clean crossfade into the new loop — a normal loop->loop transition.
  if (isInGreenZone)
    return PatternPatternTransition.make({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [current, incoming],
    })

  // Red: `current` is already fading out to silence and we can't take it back.
  // It finishes dying while the new loop rolls in — a pattern->silence->pattern.
  return PatternSilencePatternTransition.make({
    playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    transitionQueue: [current, incoming],
  })
})
