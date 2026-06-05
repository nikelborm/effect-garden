import * as Schema from 'effect/Schema'

import { PatternPatternPatternTransition } from './PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransition } from './PatternPatternSilenceTransition.ts'
import { PatternPatternTransition } from './PatternPatternTransition.ts'
import { PatternSilenceTransition } from './PatternSilenceTransition.ts'
import { PlayingPattern } from './PlayingPattern.ts'
import { PlayingSlowStrum } from './PlayingSlowStrum.ts'
import { Silence } from './Silence.ts'
import { SlowStrumPatternTransition } from './SlowStrumPatternTransition.ts'

export const PlayingAppPlaybackStates = Schema.Union(
  PatternPatternPatternTransition,
  PatternPatternSilenceTransition,
  PatternPatternTransition,
  PatternSilenceTransition,
  PlayingPattern,
  PlayingSlowStrum,
  SlowStrumPatternTransition,
)
export type PlayingAppPlaybackStates = Schema.Schema.Type<
  typeof PlayingAppPlaybackStates
>

export const AppPlaybackState = Schema.Union(Silence, PlayingAppPlaybackStates)
export type AppPlaybackState = Schema.Schema.Type<typeof AppPlaybackState>
