// The near-instant gain ramp for a pattern->pattern roll-over: just enough to
// avoid a click while one full-volume loop hands over to the next on the tick.
export const transitionTimeInSeconds = 0.001
// A genuine, audible fade used when a loop is STOPPING into silence (the
// "silence" trajectory). Much longer than a roll-over so stopping reads as a
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
export const ticksPerTrack = 8
export const tickSizeInSeconds = 1
export const trackSizeInSeconds = ticksPerTrack * tickSizeInSeconds
