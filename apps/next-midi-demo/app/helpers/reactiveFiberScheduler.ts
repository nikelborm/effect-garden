import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Runtime from 'effect/Runtime'
import * as Stream from 'effect/Stream'
import * as SynchronizedRef from 'effect/SynchronizedRef'

export const reactivelySchedule = <TStreamA, TStreamR, TEffectR>(
  stream: Stream.Stream<TStreamA, never, TStreamR>,
  execute: (a: TStreamA) => Effect.Effect<any, never, TEffectR>,
) =>
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime<TStreamR | TEffectR>()
    const scope = yield* Effect.scope
    const runFork = <A, E>(
      effect: Effect.Effect<A, E, TStreamR | TEffectR>,
      options?: Runtime.RunForkOptions | undefined,
    ) =>
      Runtime.runFork(
        runtime,
        Effect.tapErrorCause(effect, Effect.logError),
        options,
      )

    const runForkScoped = <A, E>(
      effect: Effect.Effect<A, E, TStreamR | TEffectR>,
      options?: Omit<Runtime.RunForkOptions, 'scope'> | undefined,
    ) => runFork(effect, { ...options, scope })

    const planExecutionRef =
      yield* SynchronizedRef.make<null | Fiber.RuntimeFiber<void, never>>(null)

    const scheduleNew = (a: TStreamA) =>
      SynchronizedRef.updateEffect(
        planExecutionRef,
        Effect.fnUntraced(function* (executionFiber) {
          if (executionFiber) yield* Fiber.interrupt(executionFiber)

          return runForkScoped(execute(a))
        }),
      )

    stream.pipe(Stream.runForEach(scheduleNew), runForkScoped)
  })
