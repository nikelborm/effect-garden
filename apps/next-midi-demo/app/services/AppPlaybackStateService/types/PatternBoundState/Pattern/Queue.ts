import * as Schema from 'effect/Schema'

import { PatternPlayback } from '../../loopElements.ts'

export const PatternQueue = Schema.Tuple([PatternPlayback])
export const isPatternQueue = Schema.is(PatternQueue)
