// oxlint-disable no-unused-vars
/** biome-ignore-all lint/correctness/noUnusedVariables: idc */
import { divide, multiply } from '../../helpers/math.ts'

// The near-instant gain ramp for a pattern-pattern: just enough to
// avoid a click while one full-volume pattern hands over to the next on the tick.
export const transitionTimeInSeconds = 0.001
// A genuine, audible fade used when a loop is STOPPING into silence (the
// "silence" trajectory). Much longer than a pattern-pattern so stopping reads as a
// graceful ending rather than a cut. Placeholder value — will likely grow,
// possibly to multiple ticks, once the feel is dialed in.
export const fadeToSilenceTimeInSeconds = 0.3
// little time-buffer to actually execute all of the scheduling of
// cleanups and also to account the disgusting fucked-up absence of the
// fucking precision of audioContext.currentTime. Fingerprinting they
// say...
// https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime#reduced_time_precision
export const schedulingSafeBufferInSeconds = 0.03
export const maxLoudness = 1
export const minLoudness = 0.001
export const asEarlyAsPossibleInSeconds = 0

// 3/4 = 0.75 sec

// comes from meta about the file.
const beatsPerMinute = 120
const beatsPerBar = 4
// comes as a size of Audio file
const patternSizeInSeconds = 8
// potentially configurable in UI
const quantSizeInBeats = 2

// permanent/inferred from above
const secondsPerMinute = 60
const beatsPerSecond: 2 = divide(beatsPerMinute, secondsPerMinute)

const patternSizeInBeats: 16 = multiply(patternSizeInSeconds, beatsPerSecond)
const patternSizeInBars: 4 = divide(patternSizeInBeats, beatsPerBar)
const patternSizeInQuants: 8 = divide(patternSizeInBeats, quantSizeInBeats)

const quantsPerMinute: 60 = divide(beatsPerMinute, quantSizeInBeats)
const quantsPerSecond: 1 = divide(quantsPerMinute, secondsPerMinute)

const quantSizeInSeconds: 1 = divide(1, quantsPerSecond)
const quantSizeInBars: 8 = multiply(beatsPerBar, quantSizeInBeats)

export const trackSizeInSeconds: 8 = patternSizeInSeconds
export const tickSizeInSeconds: 1 = quantSizeInSeconds
export const ticksPerTrack: 8 = patternSizeInQuants

// Доля -- beat
// Такт -- bar
