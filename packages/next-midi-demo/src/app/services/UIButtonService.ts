import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'
import * as Schedule from 'effect/Schedule'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

export class UIButtonService extends Effect.Service<UIButtonService>()(
  'next-midi-demo/UIButtonService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const selectedStrengthRef = yield* SubscriptionRef.make<Strength>('m')
      const selectedStrengthChanges = selectedStrengthRef.changes

      const stateRef = yield* SubscriptionRef.make<AppPlaybackState>({
        _tag: 'NotPlaying',
      })

      const changeAsset = (_latestAsset: any) =>
        SubscriptionRef.updateEffect(
          stateRef,
          Effect.fn(function* (oldPlayback) {
            yield* Effect.log('Attempting to change the playing asset')
            if (oldPlayback._tag === 'Playing') {
              // imagine here would be some audio decoding, cleanup of
              // previous audio, and playing the new audio based on _latestAsset
            }
            return oldPlayback
          }),
        ).pipe(
          Effect.andThen(Effect.log('Finished changing the playing asset')),
        )

      yield* selectedStrengthChanges.pipe(
        Stream.tap(changeAsset),
        drainLogErrorsForkScoped,
      )

      const latestIsPlayingFlagStream = yield* stateRef.changes.pipe(
        Stream.map(cur => cur._tag === 'Playing'),
        Stream.changes,
        // PLEASE SOMEBODY EXPLAIN TO ME WHY REMOVING THIS FIXES THE ISSUE
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      const getIsSelectedStrengthStream = (strength: Strength) =>
        selectedStrengthChanges.pipe(
          Stream.map(Equal.equals(strength)),
          Stream.tap(isSelected =>
            Effect.log(
              `Strength=${strength} is ${isSelected ? '' : 'not '}selected`,
            ),
          ),
        )

      yield* Schedule.spaced('1 second').pipe(
        Schedule.compose(Schedule.recurs(2)),
        Stream.fromSchedule,
        Stream.map(i => allStrengths[(i + 1) % 3] as Strength),
        Stream.tap(newStrength =>
          Effect.log(
            `Simulated button press caused by external device. Requested to set new strength=${newStrength}`,
          ),
        ),
        Stream.tap(
          Effect.fn(function* (newStrength) {
            // I oversimplified the condition here. Let's just say, we cannot
            // change press the button to select the asset, while it's playing
            const isStrengthButtonPressable =
              yield* latestIsPlayingFlagStream.pipe(
                forceTakeFirstValueFromStream,
                Effect.map(isPlaying => !isPlaying),
              )

            yield* Effect.log(
              `isStrengthButtonPressable: ${isStrengthButtonPressable}`,
            )

            if (isStrengthButtonPressable)
              yield* SubscriptionRef.set(selectedStrengthRef, newStrength)
          }),
        ),
        drainLogErrorsForkScoped,
      )

      return { getIsSelectedStrengthStream }
    }),
  },
) {}

const drainLogErrorsForkScoped = <A, E, R>(self: Stream.Stream<A, E, R>) =>
  self.pipe(
    Stream.runDrain,
    Effect.tapErrorCause(Effect.logError),
    Effect.forkScoped,
  )

const forceTakeFirstValueFromStream = <A, E, R>(self: Stream.Stream<A, E, R>) =>
  self.pipe(Stream.take(1), Stream.runHead, Effect.map(Option.getOrThrow))

const allStrengths = ['m', 'v', 's'] as const
type AllStrengthTuple = typeof allStrengths
type AppPlaybackState =
  | { readonly _tag: 'NotPlaying' }
  | { readonly _tag: 'Playing' }
type Strength = AllStrengthTuple[number]
