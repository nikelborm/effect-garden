import * as Schema from 'effect/Schema'

import { SlowStrumPlayback } from '../../loopElements.ts'

export const SlowStrumQueue = Schema.Tuple([SlowStrumPlayback])
export const isSlowStrumQueue = Schema.is(SlowStrumQueue)
