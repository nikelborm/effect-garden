import {
  schedulingSafeBufferInSeconds,
  tickSizeInSeconds,
  trackSizeInSeconds,
  transitionTimeInSeconds,
} from './constants.ts'

export interface Slot {
  readonly tickStartsAtSecond: number
  readonly fadeoutStartsAtSecond: number
  readonly fadeoutEndsAtSecond: number
}

export const slotEndingAt = (
  tickStartsAtSecond: number,
  fadeDurationInSeconds: number = transitionTimeInSeconds,
): Slot => ({
  tickStartsAtSecond,
  fadeoutStartsAtSecond: tickStartsAtSecond - fadeDurationInSeconds,
  fadeoutEndsAtSecond: tickStartsAtSecond,
})

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

export const chosenSlot = (zone: Zone): Slot =>
  zone.isInGoodZone ? zone.immediateSlot : zone.postponedSlot
