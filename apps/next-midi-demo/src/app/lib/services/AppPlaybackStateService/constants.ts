export const transitionTimeInSeconds = 0.001
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
