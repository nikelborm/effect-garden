import { describe, it } from '@effect/vitest'
import { assertFalse, assertTrue, strictEqual } from '@effect/vitest/utils'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import * as ContextX from './Context.ts'

// Ported from https://github.com/Effect-TS/effect/pull/8171
describe('Mixin', () => {
  const A = Context.Service<number>('ContextTest/A')

  class Box {
    readonly value: number
    constructor(value: number) {
      this.value = value
    }
    double() {
      return this.value * 2
    }
    static origin() {
      return 0
    }
  }

  class MyText extends ContextX.Mixin<MyText>('ContextTest/MyText')(Box) {}

  it('stores and retrieves instances as the service', () => {
    const context = Context.make(MyText, new MyText(1))

    strictEqual(Context.get(context, MyText).value, 1)
    strictEqual(Context.get(context, MyText).double(), 2)
  })

  it.effect('yields the wrapped instance from the current context', () =>
    Effect.gen(function* () {
      const text = yield* MyText
      strictEqual(text.value, 2)
      strictEqual(text.double(), 4)
    }).pipe(Effect.provideService(MyText, new MyText(2))),
  )

  it.effect('use and useSync read the wrapped instance', () =>
    Effect.gen(function* () {
      strictEqual(yield* MyText.use(text => Effect.succeed(text.value)), 3)
      strictEqual(yield* MyText.useSync(text => text.double()), 6)
    }).pipe(Effect.provideService(MyText, new MyText(3))),
  )

  it('preserves the original constructor and instance members', () => {
    const text = new MyText(2)

    assertTrue(text instanceof MyText)
    assertTrue(text instanceof Box)
    strictEqual(text.constructor, MyText)
    strictEqual(text.value, 2)
    strictEqual(text.double(), 4)
    strictEqual(MyText.origin(), 0)
  })

  it('makes the class a service key without turning instances into Effects', () => {
    assertTrue(Context.isKey(MyText))
    assertTrue(Effect.isEffect(MyText))
    assertFalse(Effect.isEffect(new MyText(1)))
    strictEqual(MyText.key, 'ContextTest/MyText')
    strictEqual(MyText.of(new MyText(4)).value, 4)
    strictEqual(Context.get(MyText.context(new MyText(5)), MyText).value, 5)
    strictEqual(
      MyText.pipe(service => service.key),
      'ContextTest/MyText',
    )
  })

  it('does not modify the original class prototype', () => {
    assertFalse(Context.isKey(Box))
    assertFalse(Effect.isEffect(Box))
    assertFalse(Effect.isEffect(new Box(1)))
  })

  it('invalidates the fiber cache when fiberCached is set', () => {
    class CachedText extends ContextX.Mixin<CachedText>(
      'ContextTest/CachedText',
      { fiberCached: true },
    )(Box) {}
    // `hasSameCache` is `@internal` in `effect`, so it is missing from its
    // published typings, but it is still exported at runtime.
    const { hasSameCache } = Context as unknown as {
      hasSameCache: (
        self: Context.Context<never>,
        that: Context.Context<never>,
      ) => boolean
    }
    const source = Context.make(A, 1)

    assertFalse(
      hasSameCache(source, Context.add(source, CachedText, new CachedText(1))),
    )
    assertTrue(hasSameCache(source, Context.add(source, MyText, new MyText(1))))
  })

  describe('static members of the wrapped class', () => {
    class Counter {
      static readonly label: string = 'counter'
      static created = 0
      static #secret = 42

      static get secret() {
        return Counter.#secret
      }
      static get description() {
        return `${this.label}#${this.created}`
      }
      static create<T extends typeof Counter>(
        this: T,
        n: number,
      ): InstanceType<T> {
        this.created++
        return new this(n) as InstanceType<T>
      }
      static of(n: number): string {
        return `counter-${n}`
      }
      static toString() {
        return 'Counter'
      }

      readonly n: number
      constructor(n: number) {
        this.n = n
      }
    }

    class MyCounter extends ContextX.Mixin<MyCounter>('ContextTest/MyCounter')(
      Counter,
    ) {}

    it('inherits static fields, getters and private-backed accessors', () => {
      strictEqual(MyCounter.label, 'counter')
      strictEqual(MyCounter.secret, 42)
      strictEqual(MyCounter.description, 'counter#0')
    })

    it('binds `this` in static methods to the mixin class', () => {
      const counter = MyCounter.create(7)

      assertTrue(counter instanceof MyCounter)
      strictEqual(counter.n, 7)
      strictEqual(
        Context.get(Context.make(MyCounter, counter), MyCounter),
        counter,
      )
    })

    it('writes to inherited mutable statics create own properties', () => {
      class Fresh extends ContextX.Mixin<Fresh>('ContextTest/Fresh')(Counter) {}
      const before = Counter.created

      Fresh.create(1)
      Fresh.create(2)

      strictEqual(Fresh.created, before + 2)
      strictEqual(Counter.created, before)
      assertTrue(Object.hasOwn(Fresh, 'created'))
    })

    it('shadows statics that collide with service methods', () => {
      const counter = new MyCounter(1)

      // `of` is the service identity function, not `Counter.of`
      strictEqual(MyCounter.of(counter as never), counter as never)
      strictEqual(
        String(MyCounter),
        '{\n  "_id": "Service",\n  "key": "ContextTest/MyCounter"\n}',
      )
      // the wrapped class keeps its own statics
      strictEqual(Counter.of(1), 'counter-1')
      strictEqual(String(Counter), 'Counter')
    })
  })

  describe('Schema classes', () => {
    class Person extends Schema.Class<Person>('ContextTest/Person')({
      name: Schema.String,
    }) {}

    class CurrentPerson extends ContextX.Mixin<CurrentPerson>(
      'ContextTest/CurrentPerson',
    )(Person) {}

    it('keeps the class usable as a schema', () => {
      const decoded = Schema.decodeUnknownSync(CurrentPerson)({ name: 'Ann' })

      assertTrue(decoded instanceof CurrentPerson)
      strictEqual(decoded.name, 'Ann')
    })

    it.effect('yields the provided schema class instance', () =>
      Effect.gen(function* () {
        const person = yield* CurrentPerson
        assertTrue(person instanceof CurrentPerson)
        strictEqual(person.name, 'Bob')
      }).pipe(
        Effect.provideService(
          CurrentPerson,
          new CurrentPerson({ name: 'Bob' }),
        ),
      ),
    )
  })
})
