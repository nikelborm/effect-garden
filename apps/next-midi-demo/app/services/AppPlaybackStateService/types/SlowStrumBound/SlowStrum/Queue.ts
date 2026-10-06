import * as Schema from 'effect/Schema'

import { SlowStrumEnqued } from '../SlowStrumEnqued.ts'

export const SlowStrumQueue = Schema.Tuple([SlowStrumEnqued])
export const isSlowStrumQueue = Schema.is(SlowStrumQueue)
