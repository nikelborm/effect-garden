import * as Reactivity from '@effect/experimental/Reactivity'
import * as BrowserRuntime from '@effect/platform-browser/BrowserRuntime'
import {
  type AtomRuntime,
  type Context,
  defaultMemoMap,
  keepAlive,
  runtime as originalRuntimeFactory,
  readable,
} from '@effect-atom/atom/Atom'
import { AtomRegistry } from '@effect-atom/atom/Registry'
import * as Result from '@effect-atom/atom/Result'
import { NoSuchElementException } from 'effect/Cause'
import * as EffectContext from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as FiberId from 'effect/FiberId'
import { globalValue } from 'effect/GlobalValue'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Runtime from 'effect/Runtime'
import { SyncScheduler } from 'effect/Scheduler'
import * as Scope from 'effect/Scope'

// const asda = ManagedRuntime.make()

const RuntimeProto = Object.getPrototypeOf(originalRuntimeFactory(Layer.empty))
console.log({ RuntimeProto })

export type RuntimeFactorySimple = <R, E>(
  create:
    | Layer.Layer<R, E, AtomRegistry | Reactivity.Reactivity>
    | ((
        get: Context,
      ) => Layer.Layer<R, E, AtomRegistry | Reactivity.Reactivity>),
) => AtomRuntime<R, E>

const fastPath = <R, E, A>(
  effect: Effect.Effect<A, E, R>,
): Exit.Exit<A, E> | undefined => {
  const op = effect as any
  switch (op._tag) {
    case 'Failure':
    case 'Success': {
      return op
    }
    case 'Left': {
      return Exit.fail(op.left)
    }
    case 'Right': {
      return Exit.succeed(op.right)
    }
    case 'Some': {
      return Exit.succeed(op.value)
    }
    case 'None': {
      // @ts-expect-error
      return Exit.fail(new NoSuchElementException())
    }
  }
}

/** @internal */
export const runCallbackSync = <R, ER = never>(runtime: Runtime.Runtime<R>) => {
  const runFork = Runtime.runFork(runtime)
  return <A, E>(
    effect: Effect.Effect<A, E, R>,
    onExit: (exit: Exit.Exit<A, E | ER>) => void,
    uninterruptible = false,
  ): (() => void) | undefined => {
    const op = fastPath(effect)
    if (op) {
      onExit(op)
      return undefined
    }
    const scheduler = new SyncScheduler()
    const fiberRuntime = runFork(effect, { scheduler })
    scheduler.flush()
    const result = fiberRuntime.unsafePoll()
    if (result) {
      onExit(result)
      return undefined
    }
    fiberRuntime.addObserver(onExit)
    function cancel() {
      fiberRuntime.removeObserver(onExit)
      if (!uninterruptible) {
        fiberRuntime.unsafeInterruptAsFork(FiberId.none)
      }
    }
    return cancel
  }
}

function makeEffect<A, E>(
  ctx: Context,
  effect: Effect.Effect<A, E, Scope.Scope | AtomRegistry>,
  initialValue: Result.Result<A, E>,
  runtime = Runtime.defaultRuntime,
  uninterruptible = false,
): Result.Result<A, E> {
  const previous = ctx.self<Result.Result<A, E>>()

  const scope = Effect.runSync(Scope.make())
  ctx.addFinalizer(() => {
    Effect.runFork(Scope.close(scope, Exit.void))
  })
  const contextMap = new Map(runtime.context.unsafeMap)
  contextMap.set(Scope.Scope.key, scope)
  contextMap.set(AtomRegistry.key, ctx.registry)
  const scopedRuntime = Runtime.make({
    context: EffectContext.unsafeMake(contextMap),
    fiberRefs: runtime.fiberRefs,
    runtimeFlags: runtime.runtimeFlags,
  })
  let syncResult: Result.Result<A, E> | undefined
  let isAsync = false
  const cancel = runCallbackSync(scopedRuntime)(
    effect,
    exit => {
      syncResult = Result.fromExitWithPrevious(exit, previous)
      if (isAsync) {
        ctx.setSelf(syncResult)
      }
    },
    uninterruptible,
  )
  isAsync = true
  if (cancel !== undefined) {
    ctx.addFinalizer(cancel)
  }
  if (syncResult !== undefined) {
    return syncResult
  } else if (previous._tag === 'Some') {
    return Result.waitingFrom(previous)
  }
  return Result.waiting(initialValue)
}

const effect = <A, E>(
  ctx: Context,
  effect: Effect.Effect<A, E, Scope.Scope | AtomRegistry>,
  options?: { readonly initialValue?: A; readonly uninterruptible?: boolean },
  runtime?: Runtime.Runtime<any>,
): Result.Result<A, E> => {
  const initialValue =
    options?.initialValue !== undefined
      ? Result.success<A, E>(options.initialValue)
      : Result.initial<A, E>()
  return makeEffect(
    ctx,
    effect,
    initialValue,
    runtime,
    options?.uninterruptible,
  )
}

export const runtimeCustomFactory: RuntimeFactorySimple = globalValue(
  '@effect-atom/atom/Atom/defaultContext',
  () => {
    const memoMap = defaultMemoMap
    const runtime = BrowserRuntime.runMain
    const globalLayer: Layer.Layer<any, any, AtomRegistry> = Reactivity.layer
    function factory<E, R>(
      create:
        | Layer.Layer<R, E, AtomRegistry | Reactivity.Reactivity>
        | ((
            get: Context,
          ) => Layer.Layer<R, E, AtomRegistry | Reactivity.Reactivity>),
    ): AtomRuntime<R, E> {
      const self = Object.create(RuntimeProto)
      self.keepAlive = false
      self.lazy = true
      self.refresh = undefined
      self.factory = factory

      const layerAtom = keepAlive(
        typeof create === 'function'
          ? readable(get => Layer.provideMerge(create(get), globalLayer))
          : readable(() => Layer.provideMerge(create, globalLayer)),
      )
      self.layer = layerAtom

      self.read = function read(get: Context) {
        const layer = get(layerAtom)
        const build = Effect.flatMap(
          Effect.flatMap(Effect.scope, scope =>
            Layer.buildWithMemoMap(layer, memoMap, scope),
          ),
          context => Effect.provide(Effect.runtime<R>(), context),
        )
        return effect(get, build, { uninterruptible: true })
      }

      return self
    }
    return factory
  },
)
