import { describe, expect, it } from 'tstyche'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import * as ContextX from './Context.ts'

// Ported from https://github.com/Effect-TS/effect/pull/8171
describe('Context.Mixin', () => {
  class Box {
    readonly value: number
    constructor(value: number) {
      this.value = value
    }
    double() {
      return this.value * 2
    }
  }

  class MyText extends ContextX.Mixin<MyText>('MyText')(Box) {}

  it('preserves constructor parameters', () => {
    expect<ConstructorParameters<typeof MyText>>().type.toBe<[value: number]>()
  })

  it('instances are the wrapped class and the service shape', () => {
    expect(new MyText(1)).type.toBeAssignableTo<Box>()
    expect(
      Context.get(Context.make(MyText, new MyText(1)), MyText),
    ).type.toBeAssignableTo<Box>()
  })

  it('propagates the wrapped instance through yield*', () => {
    const effect = Effect.gen(function* () {
      return yield* MyText
    })
    expect(effect).type.toBeAssignableTo<Effect.Effect<MyText, never, MyText>>()
  })

  it('does not add a make constructor', () => {
    expect(MyText).type.not.toHaveProperty('make')
    expect(ContextX.Mixin<MyText>).type.not.toBeCallableWith('MyText', {
      make: Effect.succeed(new MyText(1)),
    })
  })

  it('supports abstract base classes', () => {
    abstract class AbstractBox {
      readonly value: number
      constructor(value: number) {
        this.value = value
      }
      abstract double(): number
    }

    class ConcreteText extends ContextX.Mixin('ConcreteText')(AbstractBox) {
      double() {
        return this.value * 2
      }
    }

    expect<ConstructorParameters<typeof ConcreteText>>().type.toBe<
      [value: number]
    >()
    expect(new ConcreteText(1)).type.toBeAssignableTo<AbstractBox>()
    // @ts-expect-error does not implement inherited abstract member double
    class MissingDouble extends ContextX.Mixin('MissingDouble')(AbstractBox) {}
  })

  describe('static members of the wrapped class', () => {
    class Counter {
      static readonly label = 'counter'
      static #secret = 42

      static get secret() {
        return Counter.#secret
      }
      static create<T extends typeof Counter>(
        this: T,
        n: number,
      ): InstanceType<T> {
        return new this(n) as InstanceType<T>
      }
      static of(n: number): string {
        return `counter-${n}`
      }

      readonly n: number
      constructor(n: number) {
        this.n = n
      }
    }

    class MyCounter extends ContextX.Mixin<MyCounter>('MyCounter')(Counter) {}

    it('exposes static fields and getters', () => {
      expect(MyCounter.label).type.toBe<'counter'>()
      expect(MyCounter.secret).type.toBe<number>()
    })

    it('infers the mixin class from polymorphic `this` statics', () => {
      expect(MyCounter.create(1)).type.toBe<MyCounter>()
    })

    it('types colliding statics as overloads of both signatures', () => {
      // Runtime `of` is the service identity function, but the wrapped
      // class signature still typechecks: a known unsoundness of the mixin.
      expect(MyCounter.of).type.toBeCallableWith(1)
      expect(MyCounter.of).type.toBeCallableWith(new MyCounter(1))
    })
  })

  it('keeps schema classes usable as schemas', () => {
    class Person extends Schema.Class<Person>('Person')({
      name: Schema.String,
    }) {}
    class CurrentPerson extends ContextX.Mixin<CurrentPerson>('CurrentPerson')(
      Person,
    ) {}

    expect(Schema.decodeUnknownSync(CurrentPerson)({})).type.toBe<Person>()
    expect(
      Effect.gen(function* () {
        return yield* CurrentPerson
      }),
    ).type.toBe<Effect.Effect<Person, never, CurrentPerson>>()
  })
})
