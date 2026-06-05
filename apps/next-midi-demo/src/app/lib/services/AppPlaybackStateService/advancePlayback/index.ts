import * as Effect from 'effect/Effect'

import type { AssetPointer } from '../../../brandsAndDatas/AssetPointer.ts'
import type { AppPlaybackState } from '../types/index.ts'
import { advancePatternPatternTransition } from './advancePatternPatternTransition.ts'
import { advancePatternSilenceTransition } from './advancePatternSilenceTransition.ts'
import { advancePlayingPattern } from './advancePlayingPattern.ts'
import { advancePlayingSlowStrum } from './advancePlayingSlowStrum.ts'
import { advanceSilence } from './advanceSilence.ts'
import { advanceSlowStrumPatternTransition } from './advanceSlowStrumPatternTransition.ts'
import type { AdvancePlaybackDeps } from './deps.ts'
import type { Signal } from './signal.ts'

export type { AdvancePlaybackDeps } from './deps.ts'

export const advancePlayback = Effect.fn('advancePlayback')(function* (
  oldState: AppPlaybackState,
  signal: Signal,
  deps: AdvancePlaybackDeps,
) {
  yield* Effect.log('advancePlayback', { oldState, signal, deps })
  switch (oldState._tag) {
    case 'Silence':
      return yield* advanceSilence(oldState, signal, deps)
    case 'PlayingPattern':
      return yield* advancePlayingPattern(oldState, signal, deps)
    case 'PlayingSlowStrum':
      return yield* advancePlayingSlowStrum(oldState, signal, deps)
    // case 'PatternPatternTransition':
    //   return yield* advancePatternPatternTransition(oldState, signal, deps)
    // case 'SlowStrumPatternTransition':
    //   return yield* advanceSlowStrumPatternTransition(oldState, signal, deps)
    // case 'PatternSilenceTransition':
    //   return yield* advancePatternSilenceTransition(oldState, signal, deps)
    default: {
      yield* Effect.logError('Unhandled advancePlayback', {
        oldState,
        signal,
        deps,
      })
      return yield* Effect.dieMessage('Unhandled advancePlayback')
    }
  }
})
