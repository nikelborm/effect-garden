import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
export class Crypto extends Context.Service<Crypto>()('Crypto', {
  make: Effect.gen(function* () {
    yield* Effect.log('Crypto init')
    return {}
  }),
}) {}
