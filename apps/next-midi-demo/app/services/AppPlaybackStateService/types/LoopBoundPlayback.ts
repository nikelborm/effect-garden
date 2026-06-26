import * as Schema from 'effect/Schema'

import {
  ScheduledPatternTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from './common.ts'
import {
  FadingOutLoopPlayback,
  IncomingLoopFadingIn,
  LoopPlaybackAtItsLastPlayWithScheduledLongFadeout,
  LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop,
  PlayingLoopPlayback,
} from './loopElements.ts'
import { PlayingSlowStrum } from './PlayingSlowStrum.ts'

// One class for every state whose destination is a SOUNDING loop. Instead of a
// separate class per queue shape, the queue is a union of small named tuple
// schemas — one per scenario. Each scenario tuple is exported so an advancer can
// `Schema.is(...)` it to pattern-match the queue and dispatch to the matching
// small advancer. The union is assembled here.
//
// Invariants across every variant: the DESTINATION (what the user is heading
// toward) is the LAST element; what is currently SOUNDING is queue[0].

// A loop at full volume — nothing in flight. (was PlayingPattern)
export const PlayingLoopQueue = Schema.Tuple(PlayingLoopPlayback)

// A loop rolling over (near-instant fade) into the loop fading in behind it.
// queue[0] is specifically the SHORT roll-over fade. (was PatternPatternTransition)
export const LoopRolloverHandoverQueue = Schema.Tuple(
  LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop,
  IncomingLoopFadingIn,
)

// A loop on its long fade to silence while a new loop rolls in over it — the
// stop-fade doubles as the crossfade. queue[0] is specifically the LONG fade.
// (was PatternSilencePatternTransition)
export const LoopSilenceHandoverQueue = Schema.Tuple(
  LoopPlaybackAtItsLastPlayWithScheduledLongFadeout,
  IncomingLoopFadingIn,
)

// The full queue: two loops fading out (any mix of fade lengths), one fading in.
// (was PatternPatternPatternTransition) — the excluded rare case.
export const FullLoopQueue = Schema.Tuple(
  FadingOutLoopPlayback,
  FadingOutLoopPlayback,
  IncomingLoopFadingIn,
)

// Slow-strum shapes — deferred, never constructed by the loop MVP, but the queue
// admits them so the two-class model is complete.
export const PlayingSlowStrumQueue = Schema.Tuple(PlayingSlowStrum)
export const SlowStrumHandoverQueue = Schema.Tuple(
  SlowStrumTransitionQueueElement,
  ScheduledPatternTransitionQueueElement,
)

export const LoopBoundQueue = Schema.Union(
  PlayingLoopQueue,
  LoopRolloverHandoverQueue,
  LoopSilenceHandoverQueue,
  FullLoopQueue,
  PlayingSlowStrumQueue,
  SlowStrumHandoverQueue,
)
export type LoopBoundQueue = Schema.Schema.Type<typeof LoopBoundQueue>

export class LoopBoundPlayback extends Schema.TaggedClass<LoopBoundPlayback>()(
  'LoopBoundPlayback',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: LoopBoundQueue,
  },
) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
