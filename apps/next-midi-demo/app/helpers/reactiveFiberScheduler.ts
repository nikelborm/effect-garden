import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Stream from 'effect/Stream'
import * as SynchronizedRef from 'effect/SynchronizedRef'

export const reactivelySchedule = Effect.fnUntraced(function* <
  TStreamA,
  TStreamR,
  TEffectR,
>(
  stream: Stream.Stream<TStreamA, never, TStreamR>,
  execute: (a: TStreamA) => Effect.Effect<any, never, TEffectR>,
) {
  const services = yield* Effect.context<TStreamR | TEffectR>()
  const runFork = Effect.runForkWith(services)
  const span = yield* Effect.currentSpan.pipe(Effect.orDie)

  const runForkLogErr = <A, E>(
    effect: Effect.Effect<A, E, TStreamR | TEffectR>,
    options?: Effect.RunOptions | undefined,
  ) => runFork(Effect.tapCause(effect, Effect.logError), options)

  const planExecutionRef = yield* SynchronizedRef.make<null | Fiber.Fiber<
    void,
    never
  >>(null)

  const scheduleNew = (a: TStreamA) =>
    SynchronizedRef.updateEffect(
      planExecutionRef,
      Effect.fnUntraced(function* (executionFiber) {
        if (executionFiber) yield* Fiber.interrupt(executionFiber)

        return yield* Effect.sync(() => runForkLogErr(execute(a)))
      }),
    )

  yield* Effect.sync(() =>
    stream.pipe(
      Stream.runForEach(scheduleNew),
      Effect.withParentSpan(span),
      runForkLogErr,
    ),
  )
})
