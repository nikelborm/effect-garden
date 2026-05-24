import * as Effect from 'effect/Effect'

export class Crypto extends Effect.Service<Crypto>()('Crypto', {
  effect: Effect.gen(function* () {
    return {}
  }),
}) {}
