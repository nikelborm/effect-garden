import * as Schema from 'effect/Schema'
import { LoopLoopLoopTransitionSchema } from './LoopLoopLoopTransition.ts'
import { LoopLoopSilenceTransitionSchema } from './LoopLoopSilenceTransition.ts'
import { LoopLoopTransitionSchema } from './LoopLoopTransition.ts'
import { LoopSilenceTransitionSchema } from './LoopSilenceTransition.ts'
import { NotPlayingSchema } from './NotPlaying.ts'
import { PlayingLoopSchema } from './PlayingLoop.ts'
import { PlayingSlowStrumSchema } from './PlayingSlowStrum.ts'
import { SlowStrumLoopTransitionSchema } from './SlowStrumLoopTransition.ts'

export const PlayingAppPlaybackStatesSchema = Schema.Union(
  PlayingLoopSchema,
  PlayingSlowStrumSchema,
  LoopLoopTransitionSchema,
  LoopSilenceTransitionSchema,
  SlowStrumLoopTransitionSchema,
  LoopLoopSilenceTransitionSchema,
  LoopLoopLoopTransitionSchema,
)
export type PlayingAppPlaybackStates = Schema.Schema.Type<typeof PlayingAppPlaybackStatesSchema>

export const AppPlaybackStateSchema = Schema.Union(
  NotPlayingSchema,
  PlayingAppPlaybackStatesSchema,
)
export type AppPlaybackState = Schema.Schema.Type<typeof AppPlaybackStateSchema>

export {
  NotPlayingSchema,
  PlayingLoopSchema,
  PlayingSlowStrumSchema,
  LoopLoopTransitionSchema,
  LoopSilenceTransitionSchema,
  SlowStrumLoopTransitionSchema,
  LoopLoopSilenceTransitionSchema,
  LoopLoopLoopTransitionSchema,
}

export type { NotPlaying } from './NotPlaying.ts'
export type { PlayingLoop } from './PlayingLoop.ts'
export type { PlayingSlowStrum } from './PlayingSlowStrum.ts'
export type { LoopLoopTransition } from './LoopLoopTransition.ts'
export type { LoopSilenceTransition } from './LoopSilenceTransition.ts'
export type { SlowStrumLoopTransition } from './SlowStrumLoopTransition.ts'
export type { LoopLoopSilenceTransition } from './LoopLoopSilenceTransition.ts'
export type { LoopLoopLoopTransition } from './LoopLoopLoopTransition.ts'

export * from './common.ts'
