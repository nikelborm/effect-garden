import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as EFunction from 'effect/Function'
import * as Ref from 'effect/Ref'
import * as Runtime from 'effect/Runtime'
import * as Stream from 'effect/Stream'

export const reactivelySchedule = <StreamA, StreamR, EffectR>(
  stream: Stream.Stream<StreamA, never, StreamR>,
  execute: (a: StreamA) => Effect.Effect<any, never, EffectR>,
) =>
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime<StreamR | EffectR>()
    const scope = yield* Effect.scope
    const semaphore = yield* Effect.makeSemaphore(1)
    const runFork = Runtime.runFork(runtime)

    const runForkScoped = <A, E>(
      effect: Effect.Effect<A, E, StreamR | EffectR>,
      options?: Omit<Runtime.RunForkOptions, 'scope'> | undefined,
    ) => runFork(effect, { ...options, scope })

    const planExecutionRef = yield* Ref.make<null | Fiber.RuntimeFiber<
      void,
      never
    >>(null)

    const scheduleNew = Effect.fn(function* (a: StreamA) {
      const executionFiber = yield* planExecutionRef
      if (executionFiber) yield* Fiber.interrupt(executionFiber)
      yield* Ref.set(planExecutionRef, runForkScoped(execute(a)))
    }, semaphore.withPermits(1))

    EFunction.pipe(
      stream,
      Stream.tap(scheduleNew),
      Stream.runDrain,
      runForkScoped,
    )
  })
