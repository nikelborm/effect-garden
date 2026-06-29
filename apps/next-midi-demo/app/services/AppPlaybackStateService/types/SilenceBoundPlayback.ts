import * as Schema from 'effect/Schema'

import { AccordSchema } from '../../../domain/Accord.ts'
import { StrengthSchema } from '../../../domain/Strength.ts'
import { FadingOutLoopPlayback } from './loopElements.ts'

// The neighbour of LoopBoundPlayback: every state whose destination is SILENCE.
// Same idea — the queue is a union of small named tuple schemas (so advancers can
// `Schema.is(...)` each one) — but it ALSO carries the base accord + strength,
// because once everything has faded out there is no asset left to read the
// selection from. State migrates between this class and LoopBoundPlayback as
// loops start, hand over, and stop.

// Nothing sounding. (was Silence)
export const PureSilenceQueue = Schema.Tuple()

// One loop fading out to silence. (was PatternSilenceTransition)
export const LoopFadingToSilenceQueue = Schema.Tuple(FadingOutLoopPlayback)

// Two loops fading out to silence. (was PatternPatternSilenceTransition) — the
// excluded rare case.
export const TwoLoopsFadingToSilenceQueue = Schema.Tuple(
  FadingOutLoopPlayback,
  FadingOutLoopPlayback,
)

export const SilenceBoundQueue = Schema.Union(
  PureSilenceQueue,
  LoopFadingToSilenceQueue,
  TwoLoopsFadingToSilenceQueue,
)
export type SilenceBoundQueue = typeof SilenceBoundQueue.Type

export class SilenceBoundPlayback extends Schema.TaggedClass<SilenceBoundPlayback>()(
  'SilenceBoundPlayback',
  {
    // base selection carried towards (and held during) silence
    accord: AccordSchema,
    strength: StrengthSchema,
    // grid origin of the fading loop(s); absent in pure silence (no playback,
    // therefore no grid).
    playbackStartedAtSecond: Schema.optional(Schema.Number),
    transitionQueue: SilenceBoundQueue,
  },
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

// A SilenceBoundPlayback narrowed to one queue scenario — what each small advancer
// receives as its whole oldState (see ./advancePlayback/queueIs.ts).
export interface PureSilenceState extends SilenceBoundPlayback {
  readonly transitionQueue: typeof PureSilenceQueue.Type
}
export interface LoopFadingToSilenceState extends SilenceBoundPlayback {
  readonly transitionQueue: typeof LoopFadingToSilenceQueue.Type
}
export interface TwoLoopsFadingToSilenceState extends SilenceBoundPlayback {
  readonly transitionQueue: typeof TwoLoopsFadingToSilenceQueue.Type
}
