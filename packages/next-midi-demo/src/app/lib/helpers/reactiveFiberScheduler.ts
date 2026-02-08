import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as EFunction from 'effect/Function'
import * as Runtime from 'effect/Runtime'
import * as Stream from 'effect/Stream'
import * as SynchronizedRef from 'effect/SynchronizedRef'

export const reactivelySchedule = <StreamA, StreamR, EffectR>(
  stream: Stream.Stream<StreamA, never, StreamR>,
  execute: (a: StreamA) => Effect.Effect<any, never, EffectR>,
) =>
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime<StreamR | EffectR>()
    const scope = yield* Effect.scope
    const runFork = Runtime.runFork(runtime)

    const runForkScoped = <A, E>(
      effect: Effect.Effect<A, E, StreamR | EffectR>,
      options?: Omit<Runtime.RunForkOptions, 'scope'> | undefined,
    ) => runFork(effect, { ...options, scope })

    const planExecutionRef =
      yield* SynchronizedRef.make<null | Fiber.RuntimeFiber<void, never>>(null)

    const scheduleNew = (a: StreamA) =>
      SynchronizedRef.updateEffect(
        planExecutionRef,
        Effect.fn(function* (executionFiber) {
          if (executionFiber) yield* Fiber.interrupt(executionFiber)

          return runForkScoped(execute(a))
        }),
      )

    EFunction.pipe(
      stream,
      Stream.tap(scheduleNew),
      Stream.runDrain,
      runForkScoped,
    )
  })
