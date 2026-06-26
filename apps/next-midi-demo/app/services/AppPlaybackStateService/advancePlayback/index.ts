import * as Effect from 'effect/Effect'

import type { AppPlaybackState } from '../types/index.ts'
import { advancePatternPatternTransition } from './advancePatternPatternTransition.ts'
import { advancePatternSilencePatternTransition } from './advancePatternSilencePatternTransition.ts'
import { advancePatternSilenceTransition } from './advancePatternSilenceTransition.ts'
import { advancePlayingPattern } from './advancePlayingPattern.ts'
import { advancePlayingSlowStrum } from './advancePlayingSlowStrum.ts'
import { advanceSilence } from './advanceSilence.ts'
import type { Signal } from './signal.ts'

export const advancePlayback = Effect.fn('advancePlayback')(function* (
  oldState: AppPlaybackState,
  signal: Signal,
) {
  yield* Effect.log('advancePlayback', { oldState, signal })
  switch (oldState._tag) {
    case 'Silence':
      return yield* advanceSilence(oldState, signal)
    case 'PlayingPattern':
      return yield* advancePlayingPattern(oldState, signal)
    case 'PlayingSlowStrum':
      return yield* advancePlayingSlowStrum(oldState, signal)
    case 'PatternSilenceTransition':
      return yield* advancePatternSilenceTransition(oldState, signal)
    case 'PatternPatternTransition':
      return yield* advancePatternPatternTransition(oldState, signal)
    case 'PatternSilencePatternTransition':
      return yield* advancePatternSilencePatternTransition(oldState, signal)
    // case 'SlowStrumPatternTransition':
    //   return yield* advanceSlowStrumPatternTransition(oldState, signal)
    default: {
      yield* Effect.logError('Unhandled advancePlayback', {
        oldState,
        signal,
      })
      return yield* Effect.dieMessage('Unhandled advancePlayback')
    }
  }
})
