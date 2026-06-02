import * as Schema from 'effect/Schema'

import { NotPlayingSchema } from './NotPlaying.ts'
import { PatternPatternPatternTransitionSchema } from './PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransitionSchema } from './PatternPatternSilenceTransition.ts'
import { PatternPatternTransitionSchema } from './PatternPatternTransition.ts'
import { PatternSilenceTransitionSchema } from './PatternSilenceTransition.ts'
import { PlayingPatternSchema } from './PlayingPattern.ts'
import { PlayingSlowStrumSchema } from './PlayingSlowStrum.ts'
import { SlowStrumPatternTransitionSchema } from './SlowStrumPatternTransition.ts'

export const PlayingAppPlaybackStatesSchema = Schema.Union(
  PlayingPatternSchema,
  PlayingSlowStrumSchema,
  PatternPatternTransitionSchema,
  PatternSilenceTransitionSchema,
  SlowStrumPatternTransitionSchema,
  PatternPatternSilenceTransitionSchema,
  PatternPatternPatternTransitionSchema,
)
export type PlayingAppPlaybackStates = Schema.Schema.Type<
  typeof PlayingAppPlaybackStatesSchema
>

export const AppPlaybackStateSchema = Schema.Union(
  NotPlayingSchema,
  PlayingAppPlaybackStatesSchema,
)
export type AppPlaybackState = Schema.Schema.Type<typeof AppPlaybackStateSchema>

export * from './common.ts'
export type { NotPlaying } from './NotPlaying.ts'
export type { PatternPatternPatternTransition } from './PatternPatternPatternTransition.ts'
export type { PatternPatternSilenceTransition } from './PatternPatternSilenceTransition.ts'
export type { PatternPatternTransition } from './PatternPatternTransition.ts'
export type { PatternSilenceTransition } from './PatternSilenceTransition.ts'
export type { PlayingPattern } from './PlayingPattern.ts'
export type { PlayingSlowStrum } from './PlayingSlowStrum.ts'
export type { SlowStrumPatternTransition } from './SlowStrumPatternTransition.ts'
export {
  NotPlayingSchema,
  type PatternPatternPatternTransitionSchema,
  type PatternPatternSilenceTransitionSchema,
  type PatternPatternTransitionSchema,
  type PatternSilenceTransitionSchema,
  type PlayingPatternSchema,
  PlayingSlowStrumSchema,
  type SlowStrumPatternTransitionSchema,
}
