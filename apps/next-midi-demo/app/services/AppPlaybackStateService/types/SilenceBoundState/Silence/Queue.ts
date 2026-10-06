import * as Schema from 'effect/Schema'

export const SilenceQueue = Schema.Tuple([])
export const isSilenceQueue = Schema.is(SilenceQueue)
