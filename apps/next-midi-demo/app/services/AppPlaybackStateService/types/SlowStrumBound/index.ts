import * as Schema from 'effect/Schema'

import { SlowStrumState } from './SlowStrum/State.ts'
import { SlowStrumPatternTransitionState } from './SlowStrumPatternTransition/State.ts'

export const SlowStrumBoundState = Schema.Union([
  SlowStrumState,
  SlowStrumPatternTransitionState,
])
export type SlowStrumBoundState = typeof SlowStrumBoundState.Type

export * from './Base/State.ts'
export * from './SlowStrum/Queue.ts'
export * from './SlowStrum/State.ts'
export * from './SlowStrumPatternTransition/Queue.ts'
export * from './SlowStrumPatternTransition/State.ts'
