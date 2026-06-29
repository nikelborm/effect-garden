import { describe, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import {
  LoopBoundPlayback,
  type PlayingLoopState,
} from '../types/LoopBoundPlayback.ts'
import {
  type PureSilenceState,
  SilenceBoundPlayback,
} from '../types/SilenceBoundPlayback.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import { advancePlayback } from './index.ts'
import type { Signal } from './signal.ts'

describe('advanceSilence', () => {
  it.effect(
    'takes accord',
    Effect.fnUntraced(function* () {
      // const oldState: PureSilenceState = SilenceBoundPlayback.make()
      // const signal: Signal =
    }),
  )
})
