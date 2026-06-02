import * as Schema from 'effect/Schema'

import { PatternPatternPatternTransition } from './PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransition } from './PatternPatternSilenceTransition.ts'
import { PatternPatternTransition } from './PatternPatternTransition.ts'
import { PatternSilenceTransition } from './PatternSilenceTransition.ts'
import { PlayingPattern } from './PlayingPattern.ts'
import { PlayingSlowStrum } from './PlayingSlowStrum.ts'
import { Silence } from './Silence.ts'
import { SlowStrumPatternTransition } from './SlowStrumPatternTransition.ts'

export const PlayingAppPlaybackStatesSchema = Schema.Union(
  PatternPatternPatternTransition,
  PatternPatternSilenceTransition,
  PatternPatternTransition,
  PatternSilenceTransition,
  PlayingPattern,
  PlayingSlowStrum,
  SlowStrumPatternTransition,
)
export type PlayingAppPlaybackStates = Schema.Schema.Type<
  typeof PlayingAppPlaybackStatesSchema
>

export const AppPlaybackStateSchema = Schema.Union(
  Silence,
  PlayingAppPlaybackStatesSchema,
)
export type AppPlaybackState = Schema.Schema.Type<typeof AppPlaybackStateSchema>

export * from './common.ts'
export {
  PatternPatternPatternTransition,
  PatternPatternSilenceTransition,
  PatternPatternTransition,
  PatternSilenceTransition,
  PlayingPattern,
  PlayingSlowStrum,
  Silence,
  SlowStrumPatternTransition,
}
