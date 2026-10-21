/** @effect-diagnostics strictEffectProvide:off */

import type { EAudioBuffer } from 'effect-web-audio/EAudioBuffer'

import * as Vitest from '@effect/vitest'
import * as Arbitrary from 'effect/Arbitrary'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Ref from 'effect/Ref'
import * as Schema from 'effect/Schema'

import {
  type AssetPointer,
  TaggedPatternPointer,
} from '../../../domain/AssetPointer.ts'
import { ChordData, ChordDataArbitrary } from '../../../domain/Chord.ts'
import { PatternData, PatternDataArbitrary } from '../../../domain/Pattern.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  StrengthData,
  StrengthDataArbitrary,
} from '../../../domain/Strength.ts'
import {
  theSameChordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { CleanupFiberToolkit } from '../CleanupFiberToolkit.ts'
import { AudioPlayback } from '../common.ts'
import { PatternPlayback } from '../Elements/PatternPlayback.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
import { DisposePlayback } from '../webAudioSideEffects/DisposePlayback.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
import { RestoreFullVolume } from '../webAudioSideEffects/RestoreFullVolume.ts'
import {
  type FadeIntoLoopPlaybackTiming,
  ScheduleFadeIntoLoopPlayback,
} from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import {
  type FadeoutTiming,
  ScheduleFadeOut,
} from '../webAudioSideEffects/ScheduleFadeOut.ts'
import {
  type FreshPlaybackTiming,
  StartFreshPlayback,
} from '../webAudioSideEffects/StartFreshPlayback.ts'
import { PatternState } from './Pattern⏳.ts'

interface AudioNowRequested {
  readonly _tag: 'AudioNowRequested'
}

interface AudioBufferRequested {
  readonly _tag: 'AudioBufferRequested'
  // `PatternState` only ever asks for pattern assets, never for slow strums.
  readonly asset: TaggedPatternPointer
}

interface FreshPlaybackStarted {
  readonly _tag: 'FreshPlaybackStarted'
  readonly playback: AudioPlayback
  readonly timing: FreshPlaybackTiming
}

interface FadeoutScheduled {
  readonly _tag: 'FadeoutScheduled'
  readonly playback: AudioPlayback
  readonly timing: FadeoutTiming
}

interface FadeIntoLoopPlaybackScheduled {
  readonly _tag: 'FadeIntoLoopPlaybackScheduled'
  readonly playback: AudioPlayback
  readonly timing: FadeIntoLoopPlaybackTiming
}

interface CleanupFiberRequested {
  readonly _tag: 'CleanupFiberRequested'
  readonly delayForSeconds: number
}

type CapturedAudioEvent =
  | AudioNowRequested
  | AudioBufferRequested
  | FreshPlaybackStarted
  | FadeoutScheduled
  | FadeIntoLoopPlaybackScheduled
  | CleanupFiberRequested

interface TestAudioSideEffectsLayerConfig {
  readonly now: number
  readonly capturedAudioEvents: Ref.Ref<ReadonlyArray<CapturedAudioEvent>>
}

/** Audio time is measured from `AudioContext` init, so it can't be negative. */
const audioTimeSchema = Schema.Finite.check(
  Schema.isGreaterThanOrEqualTo(0),
  Schema.isLessThanOrEqualTo(1_000),
)

const alreadyCompletedFiber = Effect.runFork(Effect.void)

/**
 * `AudioBufferSourceNode` and `GainNode` don't exist in the test environment, so
 * we bypass the declared-field checks but keep a real `AudioPlayback` instance,
 * which is all `PatternPlayback` validates.
 */
const makeFakeAudioPlayback = (): AudioPlayback =>
  Object.assign(Object.create(AudioPlayback.prototype) as AudioPlayback, {
    _tag: 'AudioPlayback',
    bufferSource: {},
    gainNode: {},
  })

const makeFakeAudioBuffer = (): EAudioBuffer => ({}) as unknown as EAudioBuffer

const makeFakeCleanupFiberToolkit = (): CleanupFiberToolkit =>
  CleanupFiberToolkit.make({
    cancelCleanup: Effect.void,
    fiberWaitingSignalToStartGarbageCollection: alreadyCompletedFiber,
    fiberWaitingDelayToGiveGarbageCollectionSignal: alreadyCompletedFiber,
    cancelDelayedCleanupSignal: Effect.void,
    cleanupImmediately: Effect.void,
  })

const onlyCapturedEventOfTag = <TTag extends CapturedAudioEvent['_tag']>(
  capturedAudioEvents: ReadonlyArray<CapturedAudioEvent>,
  tag: TTag,
): Extract<CapturedAudioEvent, { _tag: TTag }> => {
  const matchingEvents = capturedAudioEvents.filter(event => event._tag === tag)
  if (matchingEvents.length !== 1)
    throw new Error(
      `Expected exactly one "${tag}" audio event, but got ${matchingEvents.length}`,
    )

  return matchingEvents[0] as Extract<CapturedAudioEvent, { _tag: TTag }>
}

const makeTestAudioSideEffectsLayer = ({
  now,
  capturedAudioEvents,
}: TestAudioSideEffectsLayerConfig) => {
  const capture = (event: CapturedAudioEvent) =>
    Ref.update(capturedAudioEvents, events => [...events, event])

  return Layer.mergeAll(
    Layer.succeed(
      GetAudioNow,
      capture({ _tag: 'AudioNowRequested' }).pipe(Effect.as(now)),
    ),
    Layer.succeed(AudioBufferStore, {
      getByAsset: (asset: AssetPointer) =>
        capture({
          _tag: 'AudioBufferRequested',
          asset: asset as TaggedPatternPointer,
        }).pipe(Effect.as(makeFakeAudioBuffer())),
    }),
    Layer.succeed(
      StartFreshPlayback,
      (_audioBuffer, timing: FreshPlaybackTiming) => {
        const playback = makeFakeAudioPlayback()
        return capture({
          _tag: 'FreshPlaybackStarted',
          playback,
          timing,
        }).pipe(Effect.as(playback))
      },
    ),
    Layer.succeed(
      ScheduleFadeOut,
      (playback: AudioPlayback, timing: FadeoutTiming) =>
        capture({ _tag: 'FadeoutScheduled', playback, timing }),
    ),
    Layer.succeed(
      ScheduleFadeIntoLoopPlayback,
      (_audioBuffer, timing: FadeIntoLoopPlaybackTiming) => {
        const playback = makeFakeAudioPlayback()
        return capture({
          _tag: 'FadeIntoLoopPlaybackScheduled',
          playback,
          timing,
        }).pipe(Effect.as(playback))
      },
    ),
    Layer.succeed(CleanupFiberMaker, (delayForSeconds: number) =>
      capture({ _tag: 'CleanupFiberRequested', delayForSeconds }).pipe(
        Effect.as(makeFakeCleanupFiberToolkit()),
      ),
    ),
    // Not reached by `PatternState.advance`/`init`, but required by
    // `AdvancePlaybackRequirements`.
    Layer.succeed(DisposePlayback, () => Effect.void),
    Layer.succeed(RestoreFullVolume, () => Effect.void),
  )
}

const makePatternState = (
  firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
  asset: TaggedPatternPointer,
) =>
  PatternState.makeSimple(
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
    PatternPlayback.makeSimple(
      asset,
      makeFakeAudioPlayback(),
      calcBlissfulGridTimingsMath(
        firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      ),
    ),
  )

const arbitraryAnyPressedParamButtonId = Arbitrary.flatMap(
  Arbitrary.schema(Schema.Literals(['chord', 'pattern', 'strength'])),
  (kind): Arbitrary.Arbitrary<PressedParamButtonId> =>
    kind === 'chord'
      ? ChordDataArbitrary
      : kind === 'pattern'
        ? PatternDataArbitrary
        : StrengthDataArbitrary,
)

/**
 * Re-pressing the chord/strength that is already sounding is the no-op branch of
 * `advance`, so the asset and the pressed id have to agree on that dimension.
 */
const arbitraryPressOfTheSoundingChordOrStrength = pipe(
  Schema.Tuple([TaggedPatternPointer, Schema.Boolean]),
  Arbitrary.schema,
  Arbitrary.map(([asset, isChord]) => ({
    asset,
    pressedParamButtonId: isChord
      ? ChordData.make({ chord: asset.chord })
      : StrengthData.make({ strength: asset.strength }),
  })),
)

const arbitraryPressOfTheSoundingPattern = Arbitrary.map(
  Arbitrary.schema(TaggedPatternPointer),
  asset => ({
    asset,
    pressedParamButtonId: PatternData.make({ pattern: asset.pattern }),
  }),
)

/**
 * Any press that is neither the sounding chord/strength nor the sounding
 * pattern changes exactly one dimension of the asset and starts a
 * pattern-to-pattern transition.
 */
const arbitraryPressChangingTheSoundingAsset = Arbitrary.filter(
  Arbitrary.all({
    asset: Arbitrary.schema(TaggedPatternPointer),
    pressedParamButtonId: arbitraryAnyPressedParamButtonId,
  }),
  ({ asset, pressedParamButtonId }) =>
    !theSameChordOrStrengthWasPressed(pressedParamButtonId, asset) &&
    !theSamePatternWasPressed(pressedParamButtonId, asset),
)

Vitest.describe('PatternState', { concurrent: true }, () => {
  Vitest.it.effect.prop(
    'init anchors the grid at the current audio time and starts looping the exact requested asset',
    {
      asset: Arbitrary.schema(TaggedPatternPointer),
      now: audioTimeSchema,
    },
    ({ asset, now }, ctx) =>
      Effect.gen(function* () {
        const capturedAudioEvents = yield* Ref.make<
          ReadonlyArray<CapturedAudioEvent>
        >([])

        const state = yield* PatternState.init(asset).pipe(
          Effect.provide(
            makeTestAudioSideEffectsLayer({ now, capturedAudioEvents }),
          ),
        )
        const events = yield* Ref.get(capturedAudioEvents)

        ctx
          .expect(
            state.firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          )
          .toBe(now)
        ctx.expect(state.transitionQueue).toHaveLength(1)
        const currentPlayback = state.transitionQueue[0]
        ctx.expect(currentPlayback.asset).toEqual(asset)
        ctx
          .expect(currentPlayback.math)
          .toEqual(calcBlissfulGridTimingsMath(now, now))
        ctx
          .expect({
            chord: state.chord,
            pattern: state.pattern,
            strength: state.strength,
          })
          .toEqual({
            chord: asset.chord,
            pattern: asset.pattern,
            strength: asset.strength,
          })

        ctx
          .expect(events.map(event => event._tag))
          .toEqual([
            'AudioNowRequested',
            'AudioBufferRequested',
            'FreshPlaybackStarted',
          ])
        ctx
          .expect(onlyCapturedEventOfTag(events, 'AudioBufferRequested').asset)
          .toEqual(asset)
        const freshPlaybackStarted = onlyCapturedEventOfTag(
          events,
          'FreshPlaybackStarted',
        )
        ctx
          .expect(freshPlaybackStarted.timing)
          .toEqual({ isLooping: true, startAtSecond: now })
        ctx.expect(currentPlayback.playback).toBe(freshPlaybackStarted.playback)
      }),
  )

  Vitest.it.effect.prop(
    'advance returns the very same state and touches no audio effects when the sounding chord or strength is pressed again',
    {
      press: arbitraryPressOfTheSoundingChordOrStrength,
      startedAt: audioTimeSchema,
      secondsSinceGridStart: audioTimeSchema,
    },
    ({ press, startedAt, secondsSinceGridStart }, ctx) =>
      Effect.gen(function* () {
        const capturedAudioEvents = yield* Ref.make<
          ReadonlyArray<CapturedAudioEvent>
        >([])
        const layer = makeTestAudioSideEffectsLayer({
          now: startedAt + secondsSinceGridStart,
          capturedAudioEvents,
        })

        const state = makePatternState(startedAt, press.asset)
        const stateAfterAdvance = yield* Effect.gen(() =>
          state.advance(press.pressedParamButtonId),
        ).pipe(Effect.provide(layer))

        ctx.expect(stateAfterAdvance).toBe(state)
        ctx.expect(yield* Ref.get(capturedAudioEvents)).toEqual([])
      }),
  )

  Vitest.it.effect.prop(
    'advance fades the sounding playback to silence and anchors the grid when the sounding pattern is pressed again',
    {
      press: arbitraryPressOfTheSoundingPattern,
      startedAt: audioTimeSchema,
      secondsSinceGridStart: audioTimeSchema,
    },
    ({ press, startedAt, secondsSinceGridStart }, ctx) =>
      Effect.gen(function* () {
        const capturedAudioEvents = yield* Ref.make<
          ReadonlyArray<CapturedAudioEvent>
        >([])
        const now = startedAt + secondsSinceGridStart
        const layer = makeTestAudioSideEffectsLayer({
          now,
          capturedAudioEvents,
        })
        const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
          startedAt,
          now,
        )

        const state = makePatternState(startedAt, press.asset)
        const stateAfterAdvance = yield* Effect.gen(() =>
          state.advance(press.pressedParamButtonId),
        ).pipe(Effect.provide(layer))
        const events = yield* Ref.get(capturedAudioEvents)

        ctx.expect(stateAfterAdvance._tag).toBe('PatternSilenceTransitionState')
        if (stateAfterAdvance._tag !== 'PatternSilenceTransitionState') return

        ctx
          .expect(
            stateAfterAdvance.firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          )
          .toBe(startedAt)
        ctx.expect(stateAfterAdvance.transitionQueue).toHaveLength(1)
        const fadingOut = stateAfterAdvance.transitionQueue[0]
        ctx
          .expect(fadingOut._tag)
          .toBe('PatternPlaybackAtItsLastPlayWithScheduledLongFadeout')
        ctx.expect(fadingOut.asset).toEqual(press.asset)
        ctx.expect(fadingOut.playback).toBe(state.transitionQueue[0].playback)
        ctx.expect(fadingOut.math).toEqual(blissfulGridTimingsMath)
        ctx
          .expect(fadingOut.cleanupFiberToolkit)
          .toBeInstanceOf(CleanupFiberToolkit)
        ctx
          .expect({
            chord: stateAfterAdvance.chord,
            strength: stateAfterAdvance.strength,
          })
          .toEqual({
            chord: press.asset.chord,
            strength: press.asset.strength,
          })

        ctx
          .expect(events.map(event => event._tag))
          .toEqual([
            'AudioNowRequested',
            'FadeoutScheduled',
            'CleanupFiberRequested',
          ])
        const fadeoutScheduled = onlyCapturedEventOfTag(
          events,
          'FadeoutScheduled',
        )
        ctx
          .expect(fadeoutScheduled.playback)
          .toBe(state.transitionQueue[0].playback)
        ctx.expect(fadeoutScheduled.timing).toEqual({
          fadeoutStartsAtSecond:
            blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
          fadeoutEndsAtSecond:
            blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
        })
        ctx
          .expect(
            onlyCapturedEventOfTag(events, 'CleanupFiberRequested')
              .delayForSeconds,
          )
          .toBe(
            blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
          )
      }),
  )

  Vitest.it.effect.prop(
    'advance fades the sounding playback out, patches exactly the pressed dimension and fades the patched asset in',
    {
      press: arbitraryPressChangingTheSoundingAsset,
      startedAt: audioTimeSchema,
      secondsSinceGridStart: audioTimeSchema,
    },
    ({ press, startedAt, secondsSinceGridStart }, ctx) =>
      Effect.gen(function* () {
        const capturedAudioEvents = yield* Ref.make<
          ReadonlyArray<CapturedAudioEvent>
        >([])
        const now = startedAt + secondsSinceGridStart
        const layer = makeTestAudioSideEffectsLayer({
          now,
          capturedAudioEvents,
        })
        const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
          startedAt,
          now,
        )
        const desiredAsset = press.asset.makePatchedFrom(
          press.pressedParamButtonId,
        )

        const state = makePatternState(startedAt, press.asset)
        const stateAfterAdvance = yield* Effect.gen(() =>
          state.advance(press.pressedParamButtonId),
        ).pipe(Effect.provide(layer))
        const events = yield* Ref.get(capturedAudioEvents)

        ctx.expect(stateAfterAdvance._tag).toBe('PatternPatternTransitionState')
        if (stateAfterAdvance._tag !== 'PatternPatternTransitionState') return

        ctx
          .expect(
            stateAfterAdvance.firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          )
          .toBe(startedAt)
        ctx.expect(stateAfterAdvance.transitionQueue).toHaveLength(2)
        const [fadingOut, incoming] = stateAfterAdvance.transitionQueue
        ctx
          .expect(fadingOut._tag)
          .toBe('PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern')
        ctx.expect(fadingOut.asset).toEqual(press.asset)
        ctx.expect(fadingOut.playback).toBe(state.transitionQueue[0].playback)
        ctx.expect(fadingOut.math).toEqual(blissfulGridTimingsMath)
        ctx.expect(incoming._tag).toBe('IncomingPatternFadingIn')
        ctx.expect(incoming.asset).toEqual(desiredAsset)
        ctx.expect(incoming.asset).not.toEqual(press.asset)
        ctx.expect(incoming.math).toEqual(blissfulGridTimingsMath)

        ctx
          .expect(events.map(event => event._tag))
          .toEqual([
            'AudioNowRequested',
            'FadeoutScheduled',
            'CleanupFiberRequested',
            'AudioBufferRequested',
            'FadeIntoLoopPlaybackScheduled',
          ])
        const fadeoutScheduled = onlyCapturedEventOfTag(
          events,
          'FadeoutScheduled',
        )
        ctx
          .expect(fadeoutScheduled.playback)
          .toBe(state.transitionQueue[0].playback)
        ctx.expect(fadeoutScheduled.timing).toEqual({
          fadeoutStartsAtSecond:
            blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
          fadeoutEndsAtSecond:
            blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
        })
        ctx
          .expect(
            onlyCapturedEventOfTag(events, 'CleanupFiberRequested')
              .delayForSeconds,
          )
          .toBe(
            blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
          )
        ctx
          .expect(onlyCapturedEventOfTag(events, 'AudioBufferRequested').asset)
          .toEqual(desiredAsset)
        const fadeIntoLoopPlaybackScheduled = onlyCapturedEventOfTag(
          events,
          'FadeIntoLoopPlaybackScheduled',
        )
        ctx.expect(fadeIntoLoopPlaybackScheduled.timing).toEqual({
          startAtSecond:
            blissfulGridTimingsMath.secondsDecimalNowPassedSinceAudioContextInit,
          skippedSecondsDuringStart:
            blissfulGridTimingsMath.secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
          fadeInStartsAtSecond:
            blissfulGridTimingsMath.patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit,
          fadeInEndsAtSecond:
            blissfulGridTimingsMath.patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit,
        })
        ctx
          .expect(incoming.playback)
          .toBe(fadeIntoLoopPlaybackScheduled.playback)
      }),
  )
})
