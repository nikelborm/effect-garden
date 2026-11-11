/**
 * Additions to the `effect/Context` module.
 *
 * Ported from https://github.com/Effect-TS/effect/pull/8171.
 */
import * as Context from 'effect/Context'
import type * as S from 'effect/Schema'

interface MixinBase<Self, Shape = Self> extends Context.Service<Self, Shape> {
  readonly key: string
}

/**
 * Returns a subclass of the provided class that is a `Context` service key.
 *
 * **When to use**
 *
 * Use to turn an existing class into a `Context.Service` key while preserving
 * the original class constructor and instance members.
 *
 * **Details**
 *
 * Call `Context.Mixin<Self>("Key")(Base)` to create a service key from an
 * existing class. The returned class can be used with `Context.make`,
 * `Context.add`, and the Context getter functions. Constructor parameters and
 * instance members from the base class are preserved.
 *
 * **Gotchas**
 *
 * The string key is the runtime identity of the service. Reusing the same key
 * string for unrelated services makes them occupy the same slot in a `Context`.
 * Service methods such as `pipe` and `toJSON` are installed on the constructor
 * and shadow static members of the same name on the wrapped class.
 *
 * **Example** (Wrapping an existing class constructor)
 *
 * ```ts
 * import { Context } from "effect"
 * import { Context as ContextX } from "@evadev/effect-helpers"
 *
 * class Box {
 *   constructor(readonly value: number) {}
 * }
 *
 * class MyClass extends ContextX.Mixin<MyClass>("MyClass")(Box) {}
 *
 * const context = Context.make(MyClass, new MyClass(1))
 * Context.get(context, MyClass).value // => 1
 * ```
 *
 * @see {@link Context.Service} for creating service keys without wrapping a class
 *
 * @category services
 */
export const Mixin: {
  <Self>(
    id: string,
    options?:
      | {
          /** @internal */
          readonly fiberCached?: boolean | undefined
        }
      | undefined,
  ): {
    <TBase extends S.Top>(klass: TBase): TBase & MixinBase<Self, TBase['Type']>
    <TBase extends abstract new (...args: never) => object>(
      klass: TBase,
    ): TBase & MixinBase<Self>
  }
} = ((id: string, options?: { readonly fiberCached?: boolean }) =>
  (klass: abstract new () => object) => {
    // `effect` does not export its service prototype, but every key created
    // with `Context.Service` has it, and creating the key also registers
    // `fiberCached`.
    const Key = Context.Service(id, options)
    class Mixed extends klass {}
    Object.defineProperties(Mixed, {
      ...Object.getOwnPropertyDescriptors(Object.getPrototypeOf(Key)),
      key: { value: Key.key, writable: true, configurable: true },
    })
    return Mixed
  }) as never
