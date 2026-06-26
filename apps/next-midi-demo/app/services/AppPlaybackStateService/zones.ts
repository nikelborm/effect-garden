import {
  schedulingSafeBufferInSeconds,
  tickSizeInSeconds,
  trackSizeInSeconds,
  transitionTimeInSeconds,
} from './constants.ts'

// A scheduling slot: a tick boundary together with the fade-out window that
// ends on it. Every field is a plain timing VALUE (a second), never a
// conclusion — so any higher-level decision can be recreated from it.
export interface Slot {
  readonly tickStartsAtSecond: number
  readonly fadeoutStartsAtSecond: number
  readonly fadeoutEndsAtSecond: number
}

// `fadeDurationInSeconds` is how long the gain ramp lasts: a near-instant
// roll-over (default) for pattern->pattern, or a long fade-to-silence when a
// loop is stopping. A longer fade simply starts earlier; it still lands on the
// tick boundary.
export const slotEndingAt = (
  tickStartsAtSecond: number,
  fadeDurationInSeconds: number = transitionTimeInSeconds,
): Slot => ({
  tickStartsAtSecond,
  fadeoutStartsAtSecond: tickStartsAtSecond - fadeDurationInSeconds,
  fadeoutEndsAtSecond: tickStartsAtSecond,
})

// Pure. Given the second a loop is anchored to the grid and `now`, describe
// where we stand relative to the next tick boundary. Returns plain numbers so
// good/bad zone — and the choice to postpone — are recreatable without ever
// touching the opaque WebAudio graph. This is the predicate the specs are
// written in terms of: `current_time in queue[0].good_zone`.
// `fadeDurationInSeconds` is the fade the caller intends to schedule; it widens
// the bad zone (a longer fade must begin earlier, so it needs more lead time
// before the boundary). Defaults to the roll-over fade for pattern switches.
export const zoneAt = (
  gridStartedAtSecond: number,
  now: number,
  fadeDurationInSeconds: number = transitionTimeInSeconds,
) => {
  const secondsSincePlaybackStart = now - gridStartedAtSecond
  const bufferPhaseOffsetSeconds =
    secondsSincePlaybackStart % trackSizeInSeconds

  const closestTickIndex = Math.ceil(
    secondsSincePlaybackStart / tickSizeInSeconds,
  )
  const closestTickStartsAtSecond =
    gridStartedAtSecond + closestTickIndex * tickSizeInSeconds

  const immediateSlot = slotEndingAt(
    closestTickStartsAtSecond,
    fadeDurationInSeconds,
  )
  const postponedSlot = slotEndingAt(
    closestTickStartsAtSecond + tickSizeInSeconds,
    fadeDurationInSeconds,
  )

  // good zone = there is still room to schedule the fade-out safely before it
  // must begin. bad zone = too close to the boundary, so we postpone one tick.
  const isInGoodZone =
    now <= immediateSlot.fadeoutStartsAtSecond - schedulingSafeBufferInSeconds

  return {
    now,
    gridStartedAtSecond,
    bufferPhaseOffsetSeconds,
    isInGoodZone,
    immediateSlot,
    postponedSlot,
  } as const
}

export type Zone = ReturnType<typeof zoneAt>

// The slot the spec picks: good zone -> nearest (future_slot_1); bad zone ->
// the one after (future_slot_2). The postpone decision lives only here now,
// out in the open, instead of being swallowed by the timing math.
export const chosenSlot = (zone: Zone): Slot =>
  zone.isInGoodZone ? zone.immediateSlot : zone.postponedSlot
