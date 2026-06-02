import * as Schema from 'effect/Schema'

import { PatternPatternPatternTransitionSchema } from './PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransitionSchema } from './PatternPatternSilenceTransition.ts'
import { PatternPatternTransitionSchema } from './PatternPatternTransition.ts'
import { PatternSilenceTransitionSchema } from './PatternSilenceTransition.ts'
import { PlayingPatternSchema } from './PlayingPattern.ts'
import { PlayingSlowStrumSchema } from './PlayingSlowStrum.ts'
import { SilenceSchema } from './Silence.ts'
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
  SilenceSchema,
  PlayingAppPlaybackStatesSchema,
)
export type AppPlaybackState = Schema.Schema.Type<typeof AppPlaybackStateSchema>

export * from './common.ts'
export type { PatternPatternPatternTransition } from './PatternPatternPatternTransition.ts'
export type { PatternPatternSilenceTransition } from './PatternPatternSilenceTransition.ts'
export type { PatternPatternTransition } from './PatternPatternTransition.ts'
export type { PatternSilenceTransition } from './PatternSilenceTransition.ts'
export type { PlayingPattern } from './PlayingPattern.ts'
export type { PlayingSlowStrum } from './PlayingSlowStrum.ts'
export type { Silence } from './Silence.ts'
export type { SlowStrumPatternTransition } from './SlowStrumPatternTransition.ts'
export {
  type PatternPatternPatternTransitionSchema,
  type PatternPatternSilenceTransitionSchema,
  type PatternPatternTransitionSchema,
  type PatternSilenceTransitionSchema,
  type PlayingPatternSchema,
  PlayingSlowStrumSchema,
  SilenceSchema,
  type SlowStrumPatternTransitionSchema,
}
